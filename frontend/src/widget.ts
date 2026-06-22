/**
 * <chatbot-widget> — A self-contained Web Component using Shadow DOM.
 *
 * Usage:
 *   <chatbot-widget api-url="http://localhost:3000" theme="dark"></chatbot-widget>
 */

const WIDGET_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  :host {
    position: fixed;
    bottom: 24px;
    right: 24px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    z-index: 99999;
    --radius: 16px;
  }

  /* ── Fab Button ─────────────────────────────────── */
  .fab {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 26px;
  }
  .fab:hover {
    transform: scale(1.08);
    box-shadow: 0 8px 28px rgba(99,102,241,0.45);
  }
  .fab.open {
    transform: rotate(45deg) scale(1.08);
  }

  /* ── Chat Container ─────────────────────────────── */
  .chat-container {
    width: 380px;
    height: 540px;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: absolute;
    bottom: 76px;
    right: 0;
    opacity: 0;
    transform: translateY(16px) scale(0.95);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .chat-container.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* ── Light Theme ────────────────────────────────── */
  :host([theme="light"]) .chat-container,
  :host(:not([theme])) .chat-container {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  }
  :host([theme="light"]) .chat-header,
  :host(:not([theme])) .chat-header {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
  }
  :host([theme="light"]) .msg.user,
  :host(:not([theme])) .msg.user {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
  }
  :host([theme="light"]) .msg.assistant,
  :host(:not([theme])) .msg.assistant {
    background: #f3f4f6;
    color: #1f2937;
  }
  :host([theme="light"]) .chat-input-area,
  :host(:not([theme])) .chat-input-area {
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  :host([theme="light"]) .chat-input,
  :host(:not([theme])) .chat-input {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid #d1d5db;
  }
  :host([theme="light"]) .chat-input:focus,
  :host(:not([theme])) .chat-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  /* ── Dark Theme ─────────────────────────────────── */
  :host([theme="dark"]) .chat-container {
    background: #111827;
    color: #f9fafb;
    border: 1px solid #374151;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }
  :host([theme="dark"]) .chat-header {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #fff;
  }
  :host([theme="dark"]) .msg.user {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #fff;
  }
  :host([theme="dark"]) .msg.assistant {
    background: #1f2937;
    color: #e5e7eb;
  }
  :host([theme="dark"]) .chat-input-area {
    background: #1f2937;
    border-top: 1px solid #374151;
  }
  :host([theme="dark"]) .chat-input {
    background: #111827;
    color: #f9fafb;
    border: 1px solid #4b5563;
  }
  :host([theme="dark"]) .chat-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129,140,248,0.2);
  }

  /* ── Header ─────────────────────────────────────── */
  .chat-header {
    padding: 18px 20px;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .chat-header .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 6px rgba(52,211,153,0.6);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ── Messages ───────────────────────────────────── */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
  }
  .chat-messages::-webkit-scrollbar {
    width: 5px;
  }
  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(127,127,127,0.3);
    border-radius: 10px;
  }

  .msg {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.55;
    word-wrap: break-word;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .msg.user {
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .msg.assistant {
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  /* ── Typing indicator ───────────────────────────── */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
    align-self: flex-start;
  }
  .typing-indicator span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #9ca3af;
    animation: bounce 1.4s ease-in-out infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* ── Input Area ─────────────────────────────────── */
  .chat-input-area {
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }
  .chat-input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13.5px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .send-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 16px;
    transition: transform 0.15s ease, opacity 0.15s ease;
    flex-shrink: 0;
  }
  .send-btn:hover {
    transform: scale(1.06);
  }
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

class ChatbotWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private apiUrl: string = 'http://localhost:3000';
  private token: string = '';
  private sessionId: string = '';
  private isOpen: boolean = false;
  private isStreaming: boolean = false;

  // DOM references (set after render)
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private fabBtn!: HTMLButtonElement;
  private containerEl!: HTMLElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['api-url', 'theme'];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'api-url' && newValue) {
      this.apiUrl = newValue;
    }
  }

  async connectedCallback() {
    this.apiUrl = this.getAttribute('api-url') || this.apiUrl;
    this.render();
    this.bindEvents();
    await this.initSession();
  }

  // ── Render ───────────────────────────────────────────────────────────────
  private render() {
    this.shadow.innerHTML = `
      <style>${WIDGET_STYLES}</style>

      <div class="chat-container" id="container">
        <div class="chat-header">
          <span class="dot"></span>
          Chat Support
        </div>
        <div class="chat-messages" id="messages"></div>
        <div class="chat-input-area">
          <input class="chat-input" id="input" type="text"
                 placeholder="Type a message…" autocomplete="off" />
          <button class="send-btn" id="send" aria-label="Send">▶</button>
        </div>
      </div>

      <button class="fab" id="fab" aria-label="Toggle chat">💬</button>
    `;

    this.messagesEl = this.shadow.getElementById('messages')!;
    this.inputEl = this.shadow.getElementById('input') as HTMLInputElement;
    this.sendBtn = this.shadow.getElementById('send') as HTMLButtonElement;
    this.fabBtn = this.shadow.getElementById('fab') as HTMLButtonElement;
    this.containerEl = this.shadow.getElementById('container')!;
  }

  // ── Event Binding ────────────────────────────────────────────────────────
  private bindEvents() {
    this.fabBtn.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  private toggleChat() {
    this.isOpen = !this.isOpen;
    this.containerEl.classList.toggle('visible', this.isOpen);
    this.fabBtn.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      setTimeout(() => this.inputEl.focus(), 300);
    }
  }

  // ── Session Initialisation ───────────────────────────────────────────────
  private async initSession() {
    // Check localStorage for an existing session
    const saved = localStorage.getItem('chatbot_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.token = parsed.token;
        this.sessionId = parsed.sessionId;
        await this.loadHistory();
        return;
      } catch {
        localStorage.removeItem('chatbot_session');
      }
    }

    // Create a new session
    try {
      const res = await fetch(`${this.apiUrl}/session`, { method: 'POST' });
      if (!res.ok) throw new Error(`Handshake failed: HTTP ${res.status}`);
      const data = await res.json();
      this.token = data.token;
      this.sessionId = data.sessionId;
      localStorage.setItem('chatbot_session', JSON.stringify(data));
    } catch (err: any) {
      console.error('[chatbot-widget] Session init error:', err);
      this.appendMessage('assistant', `⚠️ Failed to initialize session: ${err.message || err}`);
    }
  }

  // ── Load History ─────────────────────────────────────────────────────────
  private async loadHistory() {
    try {
      const res = await fetch(`${this.apiUrl}/history`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) {
        // Token expired — clear and create a fresh session
        localStorage.removeItem('chatbot_session');
        this.token = '';
        this.sessionId = '';
        await this.initSession();
        return;
      }
      const data = await res.json();
      for (const msg of data.messages) {
        this.appendMessage(msg.role, msg.content);
      }
    } catch (err: any) {
      console.error('[chatbot-widget] History load error:', err);
      this.appendMessage('assistant', `⚠️ Failed to load history: ${err.message || err}`);
    }
  }

  // ── Send Message & Stream Response ───────────────────────────────────────
  private async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text || this.isStreaming) return;

    this.appendMessage('user', text);
    this.inputEl.value = '';
    this.isStreaming = true;
    this.sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = this.showTypingIndicator();

    try {
      const res = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Remove typing indicator and create assistant bubble
      typingEl.remove();
      const bubbleEl = this.appendMessage('assistant', '');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.content) {
              bubbleEl.textContent += parsed.content;
              this.scrollToBottom();
            }
            if (parsed.error) {
              bubbleEl.textContent += `\n⚠️ Error: ${parsed.error}`;
            }
          } catch {
            // ignore malformed JSON lines
          }
        }
      }
    } catch (err: any) {
      typingEl.remove();
      const msg = err instanceof Error ? err.message : String(err);
      this.appendMessage('assistant', `⚠️ Connection error: ${msg}. Please try again.`);
      console.error('[chatbot-widget] Stream error:', err);
    } finally {
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      this.inputEl.focus();
    }
  }

  // ── DOM Helpers ──────────────────────────────────────────────────────────
  private appendMessage(role: string, content: string): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('msg', role);
    el.textContent = content;
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private showTypingIndicator(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('typing-indicator');
    el.innerHTML = '<span></span><span></span><span></span>';
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
}

customElements.define('chatbot-widget', ChatbotWidget);
