# =====================================================================
# InterviewCoach — NestJS 11 Backend
# Production Dockerfile (multi-stage)
#
# Verify available tags trước khi deploy:
# https://hub.docker.com/_/node/tags?name=20-alpine
# =====================================================================

# ---- Stage 1: builder ----
# Mục đích: compile TypeScript + generate Prisma client.
# Image này KHÔNG đưa vào production — chỉ tạo artifacts để copy sang runner.
FROM node:20.19.2-alpine3.22 AS builder

# openssl: Prisma query engine (linux-musl-openssl) cần thư viện này tại generate-time.
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package manifests TRƯỚC source code.
# Khi chỉ source code thay đổi mà package.json không đổi, Docker dùng lại
# cache của layer npm ci → tiết kiệm 1–5 phút build time.
COPY package*.json ./

# Install ALL dependencies — devDependencies cần thiết cho: TypeScript compiler + Prisma CLI.
RUN npm ci

# Generate Prisma client TRƯỚC khi copy toàn bộ source.
# NestJS import PrismaClient tại compile-time → client phải tồn tại trước khi chạy tsc.
# Tách layer này: thay đổi schema.prisma chỉ invalidate generate, không invalidate npm ci.
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source và compile TypeScript → dist/.
# Đặt cuối: đây là layer thay đổi thường xuyên nhất.
COPY . .
RUN npm run build \
    && find dist node_modules/.prisma -type f \( -name "*.d.ts" -o -name "*.map" -o -name "*.tsbuildinfo" \) -delete

# =====================================================================

# ---- Stage 2: runner ----
# Production image — chỉ chứa runtime artifacts.
# Không có: source TypeScript, test, devDependencies, Prisma CLI.
FROM node:20.19.2-alpine3.22 AS runner

LABEL maintainer="lethanhan01" \
      version="0.0.1" \
      description="InterviewCoach NestJS API server"

# Gộp một RUN duy nhất để giảm số layer trong final image.
# openssl: Prisma query engine cần tại runtime.
# nodejs/nestjs: non-root user — không bao giờ chạy production container bằng root.
RUN apk add --no-cache openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

WORKDIR /app

# NODE_ENV=production:
#   - NestJS/Express bật production optimizations
#   - npm ci --omit=dev đọc biến này
#   - Một số package (winston, etc.) tắt debug logging khi production
ENV NODE_ENV=production \
    PORT=3000

# Install production dependencies TRƯỚC khi copy code.
# Layer này cache lâu nhất — chỉ rebuild khi package.json / package-lock.json thay đổi.
# --legacy-peer-deps: tránh npm auto-install peerOptional của @prisma/client.
# --omit=optional: bỏ các gói devOptional còn lại trong lockfile
#   (prisma CLI, typescript, effect, @electric-sql/pglite, ...).
# --ignore-scripts: không chạy postinstall generate; Prisma client đã generate ở builder.
# npm cache clean --force: xóa cache trong CÙNG layer để không inflate image size.
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional --ignore-scripts --legacy-peer-deps \
    && npm cache clean --force \
    && find node_modules -type f \( -name "*.d.ts" -o -name "*.map" -o -name "*.tsbuildinfo" \) -delete

# Copy pre-generated Prisma client từ builder.
# Cùng base image (node:20.19.2-alpine3.22) → binary engine tương thích.
# Không cần prisma CLI ở runtime → không cần đưa prisma (devDep) vào production image.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled application — layer thay đổi thường xuyên nhất, đặt cuối cùng.
# dist owned by root, nestjs user chỉ cần read access (Node.js không ghi vào dist).
COPY --from=builder /app/dist ./dist

# Switch sang non-root user sau khi tất cả file đã được copy xong.
USER nestjs

EXPOSE 3000

# HEALTHCHECK dùng Node.js built-in http — không cần curl hay wget.
# --start-period=30s: NestJS cần time khởi tạo BullMQ workers, Prisma connection pool.
# Trả về statusCode < 500 → healthy (404 Not Found là OK — server đang chạy).
# Connection error → unhealthy (server crashed hoặc chưa bind port).
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').request({hostname:'localhost',port:3000,path:'/api/v1',method:'HEAD'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"

# Exec form (JSON array): node process là PID 1, nhận SIGTERM trực tiếp.
# Không wrap qua /bin/sh → graceful shutdown hoạt động đúng với NestJS lifecycle hooks.
CMD ["node", "dist/main"]
