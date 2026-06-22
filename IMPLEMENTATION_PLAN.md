# Implementation Plan: Chatbot Mockup & Deployment Guide

This plan outlines the implementation steps to build the functioning chatbot mockup and details the deployment prerequisites and step-by-step guidance for both local and production environments, where all components (BFF, Frontend, and Redis) run inside Docker containers.

---

## 1. Prerequisites for Deployment

Ensure the following tools are installed before commencing setup:

### 1.1 Local Development Environment
*   **Docker & Docker Compose**: Required to run the Fastify BFF, Redis cache, and Vite frontend containers together.
    *   *Windows/macOS*: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (which includes Compose).
    *   *Linux*: Install `docker-ce` and `docker-compose-plugin`.
*   **LLM API Credentials**: An active API Key from OpenAI (`sk-...`) or Google Gemini (`AIzaSy...`).

### 1.2 Production Server VM (AWS EC2 / GCP VM / DigitalOcean)
*   **OS**: Ubuntu 22.04 LTS (Recommended) or any modern Linux distribution.
*   **Docker & Docker Compose v2.0+**: Installed on the remote VM.
*   **Domain Name**: A registered domain/subdomain pointing to the VM IP (for SSL termination).
*   **SSL Certificate**: Certbot installed for generating Let's Encrypt certificates.

---

## 2. Proposed Changes & Codebase Structure

We will organize the code into `backend/` and `frontend/` folders, orchestrated by Docker Compose.

```
/chatbot
├── backend/
│   ├── src/
│   │   └── server.ts       # Fastify backend orchestration server
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   └── widget.ts       # Web Component code (Shadow DOM)
│   ├── index.html          # Local test host page
│   ├── Dockerfile          # Frontend Vite container dev setup
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── docker-compose.yml      # Orchestrates backend, Redis, and frontend
```

---

## 3. Step-by-Step Deployment Guidance

### 3.1 Local Deployment (Mockup Testing via Single Compose Command)

#### Step 1: Environment Setup
1. Create a `.env` file in the root of the project by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your LLM provider and credentials:
   ```env
   PORT=3000
   JWT_SECRET=a_highly_secure_random_string_for_testing
   REDIS_URL=redis://redis_cache:6379
   ALLOWED_ORIGINS=http://localhost:5173

   # Configure LLM provider: 'gemini' or 'openai'
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_actual_gemini_api_key
   # OPENAI_API_KEY=your_actual_openai_api_key
   ```

#### Step 2: Spin Up All Components (Single Command)
Run the following command from the root repository directory:
```bash
docker-compose up --build
```
This builds the Fastify backend image, the Vite frontend dev image, pulls the Redis Alpine image, and starts all three containers in a shared bridge network.

*   **Fastify BFF**: Accessible at `http://localhost:3000`
*   **Vite Frontend Dev Host**: Accessible at `http://localhost:5173`

Open `http://localhost:5173` in your browser to view and interact with the chatbot widget mockup. Hot reloading works automatically as you edit files in `frontend/src/` or `backend/src/` thanks to Docker bind volumes.

---

### 3.2 Production VM Deployment (Self-Hosted)

#### Step 1: VM Provisioning & Security Group Setup
1. Launch a standard VM instance (e.g., `t3.medium` on AWS or `e2-medium` on GCP).
2. Configure security groups/firewall rules to allow incoming traffic on:
   *   `80` (HTTP) -> Redirected to HTTPS.
   *   `443` (HTTPS) -> Public web traffic.
   *   `22` (SSH) -> Restrict access to your IP address.

#### Step 2: Server Prep & Setup
On the remote VM, run the following commands:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl enable --now docker

# Install Docker Compose CLI plugin
sudo apt install docker-compose-plugin -y
```

#### Step 3: Clone Repository & Create Production `.env`
1. Clone your repository onto the server.
2. Create your production `.env` file with secure values:
   *   `JWT_SECRET`: Generate a secure random 32-character string.
   *   `ALLOWED_ORIGINS`: Set to your production host website domain (e.g. `https://mywebsite.com`).
   *   `LLM_PROVIDER`, `GEMINI_API_KEY`, or `OPENAI_API_KEY`: Configure your production LLM provider and credentials.

#### Step 4: Configure Nginx Reverse Proxy (with SSL)
To handle SSL termination and SSE streaming properly, install Nginx and Certbot on the VM host:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

Modify the generated Nginx config block at `/etc/nginx/sites-available/default` (or your domain site config) to include the **crucial SSE buffer disable directives**:
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Disable SSE response buffering
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        # Timeout expansion
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        
        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Reload Nginx: `sudo systemctl restart nginx`.

#### Step 5: Start Containers in Detached Mode
In production, the frontend widget's static assets are typically built and served via Nginx or CDN, so the Compose file on the server only needs to run the backend and Redis:
```bash
# To run backend and cache only:
sudo docker compose up -d --build bff redis_cache
```
The chatbot backend will run continuously in the background, handled by Docker's restart policies, and serve traffic securely over HTTPS.

---

## 4. Verification Plan

### Manual Verification Checklist
1. **Container Health Check**: Confirm both containers are up:
   ```bash
   docker ps
   ```
2. **CORS Enforcement Check**: Execute a request from an unauthorized domain and verify the backend blocks it or omits CORS headers.
3. **SSE Streaming Check**: Inspect browser devtools Network tab. Under EventSource or Fetch, verify the message responses are chunked and render token-by-token rather than displaying all at once.
4. **Session Persistence**: Chat with the widget, refresh the browser, and verify that past messages are fetched from Redis and re-displayed inside the widget frame.
