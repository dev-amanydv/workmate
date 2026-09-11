# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Stage 1: Build NestJS backend and generate Prisma client
FROM base AS builder

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN npm ci
RUN npm run prisma:generate --workspace=backend
RUN npm run build --workspace=backend

# Stage 2: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy workspace package manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# Install production dependencies only (including prisma CLI in dependencies)
RUN npm ci --omit=dev

# Copy compiled backend dist and generated Prisma client artifacts
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/backend

# Copy entrypoint script
COPY apps/backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create local uploads directory
RUN mkdir -p uploads

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
