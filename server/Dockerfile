# ==============================================================================
# CONFIGURATION & GLOBAL ARGS
# ==============================================================================
ARG NODE_VERSION=22-bookworm-slim

# ==============================================================================
# STAGE 1: BUILDER & COMPILATION (builder)
# ==============================================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Install OpenSSL & CA certificates cho Prisma Query Engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Cache dependency layer cho full installation (devDependencies cần thiết cho tsc và Prisma CLI)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

# Copy Prisma schema & configuration TRƯỚC khi compile
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code và compile TypeScript sang JavaScript trong dist/
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
RUN npm run build

# ==============================================================================
# STAGE 2: PRODUCTION DEPENDENCIES BUNDLE (deps-prod)
# ==============================================================================
FROM node:${NODE_VERSION} AS deps-prod

WORKDIR /app

# Install CHỈ production dependencies bằng locked npm cache
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev --omit=optional --ignore-scripts --legacy-peer-deps

# Import Prisma client & query engine đã sinh ở stage builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Dọn dẹp static rác: sourcemaps, declaration maps, markdown và docs để tiết kiệm dung lượng
RUN find node_modules -type f \( -name "*.map" -o -name "*.d.ts.map" -o -name "*.md" -o -name "CHANGELOG*" -o -name "README*" -o -name "LICENSE*" \) -delete && \
    find node_modules -type d \( -name ".github" -o -name "docs" \) -exec rm -rf {} + 2>/dev/null || true

# ==============================================================================
# STAGE 3: PRODUCTION RUNNER (runner)
# ==============================================================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

LABEL maintainer="lethanhan01" \
      version="0.0.1" \
      description="InterviewCoach NestJS API & Worker Server"

# Cấu hình biến môi trường runtime mặc định
ENV NODE_ENV=production \
    PORT=3000

# Cài đặt tini (init supervisor) và openssl
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    openssl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Phân quyền thư mục cho user không đặc quyền 'node' (UID 1000 có sẵn trong Debian Node image)
RUN chown -R node:node /app

# TỐI ƯU CỐT LÕI: Đúng DUY NHẤT 1 COPY cho node_modules từ deps-prod (0 duplicate layer)
COPY --chown=node:node --from=deps-prod /app/node_modules ./node_modules

# Copy application manifests & Prisma files
COPY --chown=node:node package*.json prisma.config.ts ./
COPY --chown=node:node --from=builder /app/prisma ./prisma

# Copy mã nguồn compiled từ builder
COPY --chown=node:node --from=builder /app/dist ./dist

# Chuyển sang non-root user
USER node

EXPOSE 3000

# Healthcheck probe sử dụng Node 22 native fetch trỏ vào endpoint /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Supervisor init entrypoint: Xử lý signal forwarding (SIGTERM) và zombie process reaping
ENTRYPOINT ["tini", "-s", "--"]

# Lệnh khởi chạy mặc định (có thể override trong docker-compose bằng --role=worker)
CMD ["node", "dist/main.js", "--role=api"]
