# ─────────────────────────────────────────────
#  Stage 1: Build
# ─────────────────────────────────────────────
FROM node:24-slim AS builder

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests first (better Docker layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json            ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json        ./artifacts/mockup-sandbox/
COPY artifacts/social-app/package.json            ./artifacts/social-app/
COPY lib/api-client-react/package.json            ./lib/api-client-react/
COPY lib/api-spec/package.json                    ./lib/api-spec/
COPY lib/api-zod/package.json                     ./lib/api-zod/
COPY lib/db/package.json                          ./lib/db/
COPY scripts/package.json                         ./scripts/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the source
COPY . .

# ── Build the API server (esbuild bundles to dist/index.mjs) ──
RUN pnpm --filter @workspace/api-server run build

# ── Build the frontend (Vite → artifacts/social-app/dist/public) ──
# PORT is required by vite.config.ts validation (not used at build, only dev)
# BASE_PATH sets the asset base URL (/ = served from root)
# VITE_CLERK_PUBLISHABLE_KEY must be injected here so Clerk loads in the browser
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN PORT=7860 BASE_PATH=/ NODE_ENV=production \
    pnpm --filter @workspace/social-app run build

# ─────────────────────────────────────────────
#  Stage 2: Runtime
# ─────────────────────────────────────────────
FROM node:24-slim

# Install nginx + supervisor (runs nginx & node in parallel)
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# ── Copy only what the API server needs at runtime ──
# @google-cloud/storage is externalized by esbuild → must be in node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/db/package.json                ./lib/db/
COPY scripts/package.json               ./scripts/
# mockup-sandbox not needed at runtime but pnpm workspace requires the manifest
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/

RUN pnpm install --no-frozen-lockfile --prod \
    --filter @workspace/api-server... \
    --filter @workspace/db... \
    --filter @workspace/api-zod...


# Copy the built API server bundle
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy the built frontend to nginx webroot
COPY --from=builder /app/artifacts/social-app/dist/public /var/www/html

# ── nginx & supervisor config ──
COPY nginx.conf        /etc/nginx/nginx.conf
COPY supervisord.conf  /etc/supervisor/conf.d/app.conf

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# supervisord starts both nginx and the API server
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/app.conf"]
