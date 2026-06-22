import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// ── Environment ──────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
const LLM_MODEL = process.env.LLM_MODEL || (LLM_PROVIDER === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const SESSION_TTL = 86400; // 24 hours in seconds
const MAX_CONTEXT_MESSAGES = 20; // sliding window: keep last N messages
const MAX_INPUT_LENGTH = 1000; // reject messages longer than this

// ── Clients ──────────────────────────────────────────────────────────────────
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err: Error) => console.error('❌ Redis error:', err.message));

// Configure OpenAI SDK client. For Gemini, use Google's OpenAI-compatible endpoint.
const openai = new OpenAI(
  LLM_PROVIDER === 'gemini'
    ? {
        apiKey: GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }
    : {
        apiKey: OPENAI_API_KEY,
      }
);

// ── Fastify Server ───────────────────────────────────────────────────────────
const app = Fastify({ logger: true });

// CORS — validate against the allowed origins whitelist
await app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS: Origin not allowed'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Rate Limiting
await app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
});

// ── Helper: Sign / Verify JWT ────────────────────────────────────────────────
function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
}

// ── Helper: Redis Session Operations ─────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

async function getHistory(sessionId: string): Promise<ChatMessage[]> {
  const raw = await redis.get(`session:${sessionId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

async function saveHistory(sessionId: string, messages: ChatMessage[]): Promise<void> {
  await redis.set(`session:${sessionId}`, JSON.stringify(messages), 'EX', SESSION_TTL);
}

// ── Route: POST /session ─────────────────────────────────────────────────────
// Creates a new guest session and returns a signed JWT + sessionId.
app.post('/session', async (_request, reply) => {
  const sessionId = uuidv4();
  const token = signToken({ sessionId, role: 'guest' });

  // Initialize empty session in Redis
  await saveHistory(sessionId, []);

  return reply.send({ sessionId, token });
});

// ── Route: POST /chat ────────────────────────────────────────────────────────
// Accepts a user message, streams the LLM response via SSE.
app.post('/chat', async (request, reply) => {
  // 1. Authenticate
  const authHeader = (request.headers as Record<string, string>).authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
  }

  let payload: jwt.JwtPayload;
  try {
    payload = verifyToken(authHeader.slice(7));
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const sessionId = payload.sessionId as string;

  // 2. Validate input
  const body = request.body as { message?: string };
  const userMessage = body?.message?.trim();
  if (!userMessage) {
    return reply.status(400).send({ error: 'Message is required' });
  }
  if (userMessage.length > MAX_INPUT_LENGTH) {
    return reply.status(400).send({ error: `Message exceeds ${MAX_INPUT_LENGTH} character limit` });
  }

  // 3. Load chat history from Redis & apply sliding window
  let history = await getHistory(sessionId);

  // Add the new user message
  history.push({ role: 'user', content: userMessage, timestamp: Date.now() });

  // Sliding window: keep only the last N messages (plus system prompt gets prepended separately)
  if (history.length > MAX_CONTEXT_MESSAGES) {
    history = history.slice(-MAX_CONTEXT_MESSAGES);
  }

  // 4. Build the prompt payload for OpenAI
  const messagesForLLM: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content:
        'You are a helpful, friendly customer support assistant. Be concise and clear in your responses.',
    },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // 5. Set SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Tells Nginx to disable buffering
  });

  // 6. Stream the LLM response
  let fullAssistantResponse = '';

  try {
    const stream = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: messagesForLLM,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullAssistantResponse += delta;
        reply.raw.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Send the [DONE] signal
    reply.raw.write(`data: [DONE]\n\n`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown LLM error';
    console.error('❌ LLM stream error:', errorMessage);
    reply.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    reply.raw.write(`data: [DONE]\n\n`);
  }

  // 7. Save the full conversation (user + assistant) back to Redis
  history.push({
    role: 'assistant',
    content: fullAssistantResponse,
    timestamp: Date.now(),
  });
  await saveHistory(sessionId, history);

  reply.raw.end();
});

// ── Route: GET /history ──────────────────────────────────────────────────────
// Returns the chat history for a given session (used on page reload).
app.get('/history', async (request, reply) => {
  const authHeader = (request.headers as Record<string, string>).authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
  }

  let payload: jwt.JwtPayload;
  try {
    payload = verifyToken(authHeader.slice(7));
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const history = await getHistory(payload.sessionId as string);
  return reply.send({ messages: history });
});

// ── Route: GET /health ───────────────────────────────────────────────────────
app.get('/health', async (_request, reply) => {
  const redisStatus = redis.status === 'ready' ? 'ok' : 'degraded';
  return reply.send({ status: 'ok', redis: redisStatus, timestamp: new Date().toISOString() });
});

// ── Start ────────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 Chatbot BFF listening on http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
