# Deploying the PageForge bridge server

The bridge (`sse-server.js` + `mcp-server.js`) is what lets the Chrome extension and
AI clients reach your Figma plugin. You can run it locally, or deploy it so a team
can share one instance.

## What it does

- **SSE endpoint** `GET /mcp-stream?sessionId=...` — your Figma plugin connects here and waits.
- **Trigger endpoint** `POST /mcp-trigger` — accepts `{ type, function, arguments:{html,name}, sessionId, requestId, source }` with `Authorization: Bearer <API_KEY>`, and forwards the HTML to the matching Figma session.
- **Health** `GET /mcp-status` — `{ status, activeSessions, ... }`.

## Local

```bash
npm install
node sse-server.js
# optional, for AI clients:
node mcp-server.js
```

Server URL: `http://localhost:3003`, API key: `dev-key` (dev mode skips auth).

## Environment variables

| Var | Default | Meaning |
|---|---|---|
| `PORT` / `SSE_PORT` | `3003` | Listen port |
| `SSE_HOST` | `localhost` | Bind host |
| `API_KEY` | `dev-key` | Bearer token required in production |
| `NODE_ENV` | `development` | `production` enforces API key |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

In production set `NODE_ENV=production` and a strong `API_KEY`, then configure the
extension / MCP clients with that key.

## Deploy to Render (example)

1. New **Web Service**, connect your GitHub repo.
2. Build command: `npm install`
3. Start command: `node sse-server.js`
4. Add env `NODE_ENV=production`, `API_KEY=<strong>`, `PORT=3003`.
5. Use the generated `https://….onrender.com` as the extension's **Server URL**.

> The free tier spins down when idle; the first capture after a pause may take a few
> seconds while it wakes.

## Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3003
CMD ["node", "sse-server.js"]
```

Then: `docker build -t pageforge . && docker run -p 3003:3003 -e NODE_ENV=production -e API_KEY=strong pageforge`

## Sharing with a team

Run one instance, give everyone the same **Server URL** + **API Key**, and each
person's Figma plugin generates its own **Session ID**. The server routes captures
to the correct session, so multiple people can use one server safely.
