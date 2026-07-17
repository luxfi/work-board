# Multi-stage build for the Zoo DAO /work bounty board (static SPA).
# Built by CI (ARC + GHCR) — never `docker build` locally.
# VITE_RPC_URL is baked at build time; the board fetches the public, CORS-enabled
# Zoo RPC directly (access-control-allow-origin: * verified on api.zoo.network).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_RPC_URL=https://api.zoo.network/v1/bc/C/rpc
ENV VITE_RPC_URL=$VITE_RPC_URL
RUN npm run build

# Serve the static build with SPA fallback. No nginx/caddy — a minimal static server.
FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve@14 && npm cache clean --force
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
# -s: single-page-app rewrite to index.html; -l: listen port.
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
