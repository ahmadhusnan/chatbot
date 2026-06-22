# 🤖 Chatbot Widget Integration

A portable, secure, and scalable website chatbot widget powered by external LLM APIs (OpenAI / Google Gemini). Designed as a plug-and-play Web Component that can be embedded on any website with a single `<script>` tag.

---

## Executive Overview

| Dimension | Decision |
| :--- | :--- |
| **Frontend** | Vanilla TypeScript Web Component (Shadow DOM) — zero framework dependencies, ~15KB gzipped |
| **Backend** | Node.js + Fastify (TypeScript) — Backend-for-Frontend pattern, multi-LLM support (OpenAI, Gemini) |
| **Streaming** | Server-Sent Events (SSE) — real-time token-by-token rendering |
| **State** | Redis ephemeral cache — 24-hour TTL, sliding window context management |
| **Auth** | Hybrid — anonymous guest JWTs + optional host-verified tokens |
| **Infrastructure** | Docker Compose — single command launches the entire stack |

### Architecture Flow

```
┌─────────────────┐     POST /session     ┌─────────────────┐     Redis GET/SET     ┌───────────┐
│  Host Website    │ ◄──────────────────► │  Fastify BFF    │ ◄──────────────────► │   Redis   │
│  (Vite Docker)   │     POST /chat (SSE) │  (Node Docker)  │                      │  (Docker) │
└─────────────────┘                       └────────┬────────┘                      └───────────┘
                                                   │
                                                   │  LLM Streaming API (OpenAI SDK / compatible)
                                                   ▼
                                          ┌─────────────────┐
                                          │  External LLM   │
                                          │ (OpenAI/Gemini) │
                                          └─────────────────┘
```

---

## Quick Start — Local Docker Deployment

### Prerequisites

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Docker Desktop** | Latest | Container runtime ([download](https://www.docker.com/products/docker-desktop/)) |
| **Docker Compose** | v2.0+ | Included with Docker Desktop |
| **LLM API Key** | — | Required for LLM responses (OpenAI API Key or Google Gemini API Key) |

> **Note**: You do **not** need Node.js installed locally — everything runs inside containers.

### Step 1: Configure Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Edit the `.env` file and configure your LLM provider and credentials:

```env
PORT=3000
JWT_SECRET=replace_with_a_strong_random_string
REDIS_URL=redis://redis_cache:6379
ALLOWED_ORIGINS=http://localhost:5173

# Choose 'gemini' or 'openai'
LLM_PROVIDER=gemini

# Provide the API key for your chosen provider
GEMINI_API_KEY=AIzaSy...
# OPENAI_API_KEY=sk-...

# (Optional) Override default models (defaults: gemini-2.0-flash / gpt-4o-mini)
# LLM_MODEL=gemini-2.0-flash
```

### Step 2: Launch the Entire Stack

```bash
docker-compose up --build
```

This single command will:
1. **Build** the Fastify backend container (Node 20 Alpine)
2. **Build** the Vite frontend container (Node 20 Alpine)
3. **Pull** the Redis 7 Alpine image
4. **Start** all three services in a shared bridge network

### Step 3: Open the Demo

Open your browser and navigate to:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Widget Demo** | [http://localhost:5173](http://localhost:5173) | Mock host page with the chatbot widget |
| **Backend API** | [http://localhost:3000/health](http://localhost:3000/health) | Health check endpoint |

Click the **💬 chat bubble** in the bottom-right corner to start chatting.

### Stopping the Stack

```bash
# Stop and remove containers
docker-compose down
```

---

## Embedding on Your Website

Once the backend is deployed, embed the widget on any page with two lines:

```html
<script src="https://your-cdn.com/chatbot.js" defer></script>
<chatbot-widget api-url="https://api.yourdomain.com" theme="dark"></chatbot-widget>
```

| Attribute | Required | Description |
| :--- | :--- | :--- |
| `api-url` | ✅ | The URL of the deployed Fastify BFF backend |
| `theme` | ❌ | `"light"` (default) or `"dark"` |
| `client-jwt` | ❌ | Optional host-signed JWT for authenticated users |

---

## Project Structure

```
/chatbot
├── backend/
│   ├── src/server.ts        # Fastify BFF: sessions, SSE streaming, Redis, JWT
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/widget.ts        # Web Component (Shadow DOM) with full chat UI
│   ├── index.html           # Demo host page
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Orchestrates all 3 services
├── .env.example             # Environment variable template
├── .gitignore
├── ARCHITECTURAL_BLUEPRINT.md
├── IMPLEMENTATION_PLAN.md
└── README.md                # ← You are here
```

---

## Documentation

| Document | Description |
| :--- | :--- |
| [ARCHITECTURAL_BLUEPRINT.md](./ARCHITECTURAL_BLUEPRINT.md) | Full system architecture, tech stack rationale, security model, and infrastructure design |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Step-by-step deployment guidance for local and production environments |

---

## License

This project is proprietary. All rights reserved.