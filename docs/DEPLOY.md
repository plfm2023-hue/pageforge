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

## Deploy to Render (Blueprint — 推荐)

仓库根目录已包含 `render.yaml`，自动部署：

1. Render 控制台 **New** → **Blueprint** → 选择本仓库（或先 Connect 仓库）。
2. Blueprint 会读取 `render.yaml`：创建名为 `pageforge` 的免费 Web 服务，
   用 `Dockerfile` 构建，从 `dev` 分支部署，健康检查 `/mcp-status`。
3. 在 Render 的 Environment 里给 `API_KEY` 设一个强随机值（首次部署前填好）。
4. 部署完成后拿到 `https://<你的实例>.onrender.com`，填进扩展的 **Server URL**。

> 手动方式（不用 Blueprint）也行：New Web Service → Build `npm install` → Start
> `node sse-server.js` → 加 `NODE_ENV=production`、`API_KEY=<strong>`、`PORT=3003`。

> The free tier spins down when idle; the first capture after a pause may take a few
> seconds while it wakes.

## Docker

仓库已提交 `Dockerfile`（基于 `node:20-alpine`，仅装运行时依赖）：

```bash
docker build -t pageforge .
docker run -p 3003:3003 -e NODE_ENV=production -e API_KEY=strong pageforge
```

## CI

仓库已提交 `.github/workflows/ci.yml`：在 `main` / `dev` 的 push 与 PR 上自动
`npm install` → `npm run build` → 校验 `sse-server.js` / `mcp-server.js` 语法。

## Sharing with a team

Run one instance, give everyone the same **Server URL** + **API Key**, and each
person's Figma plugin generates its own **Session ID**. The server routes captures
to the correct session, so multiple people can use one server safely.
