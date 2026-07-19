# Multi-stage build for the white-label /work bounty board (static SPA).
# Built by CI (ARC + GHCR) — never `docker build` locally.
# VITE_BRAND selects the white-label profile (src/brands.ts; default zoo) and
# VITE_RPC_URL is baked at build time; the board fetches the public, CORS-enabled
# brand RPC directly (access-control-allow-origin: * verified on the brand host).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# `npm install` (not `npm ci`): TypeScript 7 and Rollup 4 ship platform-specific PREBUILT
# binaries as optionalDependencies, and a darwin-generated lock omits the linux-musl variants
# (npm prunes non-current-platform optional deps). `install` resolves the correct ones on the
# linux build host. Same non-frozen approach the dao-vote image uses (pnpm --no-frozen-lockfile).
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_BRAND=zoo
ENV VITE_BRAND=$VITE_BRAND
ARG VITE_RPC_URL=https://api.zoo.network/v1/bc/C/rpc
ENV VITE_RPC_URL=$VITE_RPC_URL
# Build the artifact with Vite directly (esbuild transpiles TS — no tsc). The `npm run build`
# script also runs `tsc --noEmit`, but the TypeScript 7 NATIVE compiler has no alpine/musl binary,
# so the typecheck can't run in this image. Typecheck is a dev/CI-lint concern; the image only
# needs the bundle. Mirrors the dao-vote image, which likewise builds via `vite build` only.
RUN ./node_modules/.bin/vite build

# Serve the static build with SPA fallback. No nginx/caddy — a minimal static server.
FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve@14 && npm cache clean --force
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
# -s: single-page-app rewrite to index.html; -l: listen port.
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
