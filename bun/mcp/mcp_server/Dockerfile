# --- Build stage: install deps & prepare app ---
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Copy only manifests first for better layer caching
COPY package.json ./
# Copy whichever lockfile you have (Bun's or pnpm's). The * keeps the step from failing if absent.
COPY bun.lockb* ./

# Install dependencies (no scripts; fail if lock changes)
RUN bun install --ci

# App sources & config
COPY tsconfig.json* bunfig.toml* ./
COPY src ./src

# --- Runtime stage: lean image, non-root user, healthcheck ---
FROM oven/bun:1-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as the dedicated user shipped with the image
USER bun

# Only copy what runtime needs
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/src /app/src
COPY --from=build /app/tsconfig.json* /app/tsconfig.json
COPY --from=build /app/bunfig.toml* /app/bunfig.toml

EXPOSE 8080

# Simple health endpoint check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

# Run the TypeScript entry with Bun (Bun transpiles TS at runtime)
CMD ["bun", "run", "src/server.ts"]
