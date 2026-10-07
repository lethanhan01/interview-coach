# TASK 5.1: CHUẨN HÓA DOCKER ĐA TẦNG, MONOREPO & ĐIỀU PHỐI CONTAINER
# (MULTI-STAGE DOCKERFILES, UV PACKAGE ACCELERATION, STANDALONE NEXTJS & SECURE COMPOSE)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Containerization & Local/Prod Orchestration)  
> **Áp dụng cho**: `ai-service/Dockerfile`, `server/Dockerfile`, `client/Dockerfile`, `docker-compose.yml`  
> **Tài liệu cha**: [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Bản thiết kế Docker ban đầu bộc lộ **3 điểm yếu nghiêm trọng về hiệu năng và bảo mật**:

1. **Dung Lượng Image Quá Lớn & Thời Gian Build Kéo Dài**:
   * Cài đặt PyTorch CUDA bằng `pip` thông thường tốn 10-15 phút và tạo ra image nặng $> 9\text{ GB}$. Khi triển khai lên server mới hoặc scale node, việc kéo (pull) image mất hàng chục phút.
   * *Giải pháp khắc phục*: Sử dụng công cụ **`uv`** (Astral) giúp tăng tốc độ cài đặt dependencies lên gấp 10-20 lần, kết hợp Multi-Stage Build để tách riêng 2 target: `cpu` (~1.2GB cho CI/Local) và `cuda` (~3.8GB cho GPU Production).
2. **Lộ Lọt Bí Mật Hệ Thống (Hardcoded Secrets trong Compose)**:
   * Bản thảo cũ gán cứng `POSTGRES_PASSWORD: postgrespassword` và `INTERNAL_SECRET: shared_secret_token_123` ngay trong file compose theo dõi bởi Git.
   * *Giải pháp khắc phục*: Bắt buộc chuyển sang sử dụng tệp `.env` riêng biệt có kiểm tra schema biến môi trường, tuyệt đối không commit file chứa secret vào Git.
3. **Frontend Next.js Kém Tối Ưu**:
   * Chưa áp dụng chế độ `output: "standalone"` của Next.js, khiến container frontend phải vác theo toàn bộ thư mục `node_modules` phát triển (nặng > 1GB thay vì < 180MB).

---

## 2. MULTI-STAGE DOCKERFILE CHO TỪNG THÀNH PHẦN

### 2.1 Python AI Service (`ai-service/Dockerfile`)
Sử dụng `uv` kết hợp cache mount để tối ưu hóa thời gian build:

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /app

# Cài đặt uv từ image chính thức
COPY --from=ghcr.io/astral-sh/uv:0.4.18 /uv /bin/uv

# Thư viện âm thanh hệ thống bắt buộc cho ffmpeg & libsndfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

# --- TARGET 1: CPU (Dành cho CI/CD Test & Local Dev không có GPU) ---
FROM base AS cpu
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r pyproject.toml --extra-index-url https://download.pytorch.org/whl/cpu

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- TARGET 2: CUDA PRODUCTION (Dành cho Server GPU Production) ---
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04 AS cuda
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:0.4.18 /uv /bin/uv

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/python3.11 /usr/bin/python

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r pyproject.toml

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 2.2 NestJS Backend (`server/Dockerfile`)
Tách riêng layer build và runtime `node:20-alpine` siêu nhẹ:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### 2.3 Next.js Frontend (`client/Dockerfile`)
Áp dụng cơ chế `standalone` giảm 85% dung lượng:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 3. ĐIỀU PHỐI DỊCH VỤ AN TOÀN (`docker-compose.yml`)

Bảo mật biến môi trường và thiết lập Healthcheck liên kết chặt chẽ:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: interviewai-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
      POSTGRES_DB: ${DB_NAME:-interview_coach}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: interviewai-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  ai-service:
    build:
      context: ./ai-service
      target: ${DOCKER_AI_TARGET:-cpu}
    container_name: interviewai-ai-service
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-interview_coach}
      - REDIS_URL=redis://redis:6379
      - INTERNAL_SECRET=${INTERNAL_SECRET:?INTERNAL_SECRET is required}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: interviewai-backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-interview_coach}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - AI_SERVICE_URL=http://ai-service:8000
      - INTERNAL_SECRET=${INTERNAL_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ai-service:
        condition: service_healthy

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: interviewai-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - server

volumes:
  postgres_data:
  redis_data:
```

---

## 4. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Thời Gian Build Siêu Tốc**: Nhờ `uv` và Docker layer cache, thời gian rebuild code Python chỉ mất $< 20\text{ giây}$.
2. **Kích Thước Image Tối Ưu**:
   * Image `ai-service:cpu` $< 1.3\text{ GB}$.
   * Image `server` $< 200\text{ MB}$.
   * Image `client` $< 180\text{ MB}$.
3. **Khởi Động 1-Lệnh Hoàn Hảo**: Lệnh `docker compose up -d` tự động khởi chạy 5 container theo đúng thứ tự phụ thuộc, tất cả đều đạt trạng thái `healthy` trong $< 45\text{ giây}$.
