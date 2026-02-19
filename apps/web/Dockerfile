FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS builder
ARG APP_VERSION=dev
ARG GIT_SHA=local
ARG BUILD_TIME=1970-01-01T00:00:00.000Z
ENV APP_VERSION=$APP_VERSION
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
COPY . .
RUN pnpm --filter @politracker/shared build
RUN pnpm --filter @politracker/web build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=builder /app/apps/web/postcss.config.js ./apps/web/postcss.config.js
COPY --from=builder /app/apps/web/tailwind.config.ts ./apps/web/tailwind.config.ts
COPY --from=builder /app/apps/web/app ./apps/web/app
COPY --from=builder /app/apps/web/components ./apps/web/components
COPY --from=builder /app/apps/web/lib ./apps/web/lib
COPY --from=builder /app/apps/web/middleware.ts ./apps/web/middleware.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
