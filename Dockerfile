# PageForge — SSE / MCP 服务镜像
# 运行时只依赖 @modelcontextprotocol/sdk，构建产物(code.js/ui.html)供 Figma 插件用，服务端不需要。
FROM node:20-alpine

WORKDIR /app

# 仅安装运行时依赖
COPY package.json ./
RUN npm install --omit=dev

# 复制源码
COPY . .

# 端口可由平台注入(PORT)，配置默认回退 3003
EXPOSE 3003

CMD ["node", "sse-server.js"]
