# syntax=docker/dockerfile:1
# Workbench web (Next.js). Chỉ là giao diện — dữ liệu lấy từ Workbench API qua API_URL.
# KHÔNG có bí mật nào trong image — mọi cấu hình truyền vào lúc chạy.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Cài thư viện ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build (Next.js standalone) ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
 && node docker/build-keys.mjs scrub .next/standalone/.next

# ---- Image chạy thật ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Image chạy không cần npm/corepack/yarn — bỏ đi cho ít lỗ hổng hơn
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && addgroup -S -g 1001 app && adduser -S -u 1001 -G app app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/docker/build-keys.mjs ./docker/build-keys.mjs
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER app
EXPOSE 3000

LABEL org.opencontainers.image.title="Workbench" \
      org.opencontainers.image.description="Giao diện web của Workbench — quản lý công việc, form mẫu tự sinh task" \
      org.opencontainers.image.source="https://github.com/Son30-kins/workbench" \
      org.opencontainers.image.licenses="MIT"

ENTRYPOINT ["docker-entrypoint.sh"]
