# ---- Stage 1: builder ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy manifests trước để tận dụng layer cache khi chỉ code thay đổi
COPY package*.json ./

# Cài đầy đủ deps (bao gồm devDependencies để build TypeScript)
RUN npm ci

# Copy schema Prisma và generate client trước khi copy source
COPY prisma ./prisma/
RUN npx prisma generate

# Copy toàn bộ source và build
COPY . .
RUN npm run build

# ---- Stage 2: runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

# Tạo non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

WORKDIR /app

# Cài chỉ production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy schema Prisma và generate lại client với binary phù hợp runtime image
COPY prisma ./prisma/
RUN npx prisma generate

# Copy build output từ builder
COPY --from=builder /app/dist ./dist

# Chuyển sang non-root user trước khi chạy app
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
