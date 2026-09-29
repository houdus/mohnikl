# ============================================================
# MovieBox International — Docker image
# Works on Render, Railway, Fly.io, any VPS, or
# `docker run -p 3000:3000 moviebox`
# ============================================================

FROM oven/bun:1 AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first (cached layer)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the standalone Next.js output
COPY . .
RUN bun run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", ".next/standalone/server.js"]
