FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/dev.db
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx prisma generate \
    && npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output scripts/initial-schema.sql \
    && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "node scripts/prepare-hosted.cjs && exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
