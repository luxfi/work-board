# Multi-stage build for the white-label /work bounty board (static SPA).
# Built by CI (ARC + GHCR) — never `docker build` locally.
# VITE_BRAND selects the white-label profile (src/brands.ts; default zoo) and
# VITE_RPC_URL is baked at build time; the board fetches the public, CORS-enabled
# brand RPC directly (access-control-allow-origin: * verified on the brand host).
FROM node:22-alpine AS build
WORKDIR /app
# Copy ONLY package.json (not the lock) and resolve fresh on the linux-musl build host.
# Vite 8 (Rolldown) and TypeScript 7 ship platform-specific PREBUILT native bindings as
# optionalDependencies; a committed darwin-generated lock omits the linux-musl variants and
# npm bug #4828 then refuses to add them even on `npm install` — Rolldown fails with
# "Cannot find module @rolldown/binding-linux-x64-musl". A fresh, lock-free install resolves the
# correct platform bindings. Same non-frozen spirit as the dao-vote image (pnpm --no-frozen-lockfile).
COPY package.json ./
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
