#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY INTERVIEWCOACH TRÊN VPS"
echo "=================================================="

# 1. Kiểm tra file .env trong thư mục deploy
if [[ ! -f .env ]]; then
  echo "❌ Lỗi: Không tìm thấy file .env tại thư mục $(pwd)!"
  exit 1
fi

DEPLOY_MODE="${DEPLOY_MODE:-pull}"
RUN_PRISMA_MIGRATE="${RUN_PRISMA_MIGRATE:-true}"
TARGET_IMAGE="${SERVER_IMAGE:-ghcr.io/lethanhan01/interview-coach/interviewcoach-server:latest}"

echo "📋 Chế độ deploy: $DEPLOY_MODE"
echo "🎯 Target image: $TARGET_IMAGE"

# Lưu lại Image ID hiện tại để phục vụ rollback nếu deploy gặp sự cố
PREV_IMAGE_ID=$(docker inspect --format='{{.Image}}' interviewcoach-api 2>/dev/null || true)
if [[ -n "$PREV_IMAGE_ID" ]]; then
  echo "💾 Đã ghi nhận image hiện tại để rollback nếu cần: $PREV_IMAGE_ID"
fi

# Hàm thực hiện Rollback tự động khi có sự cố
rollback() {
  echo ""
  echo "⚠️ PHÁT HIỆN SỰ CỐ TRONG QUÁ TRÌNH DEPLOY!"
  if [[ -n "$PREV_IMAGE_ID" ]]; then
    echo "🔄 Đang tiến hành tự động Rollback về image trước đó: $PREV_IMAGE_ID..."
    docker tag "$PREV_IMAGE_ID" "$TARGET_IMAGE" || true
    docker compose up -d --force-recreate server-api server-worker
    echo "✅ Đã khôi phục container về phiên bản trước!"
  else
    echo "⚠️ Không tìm thấy phiên bản container trước đó để rollback."
  fi
  exit 1
}

# 2. Kéo (Pull) hoặc Build container
if [[ "$DEPLOY_MODE" == "pull" ]]; then
  echo "📦 Đang kéo image mới nhất từ GitHub Container Registry..."
  docker compose pull server-api server-worker
else
  echo "🔨 Đang build container tại chỗ..."
  docker compose build --pull server-api server-worker
fi

# 3. Đồng bộ Schema Prisma Database qua Docker Container (nếu được bật)
if [[ "$RUN_PRISMA_MIGRATE" == "true" ]]; then
  echo "🗄️ Đang chạy Prisma Migrations qua container..."
  if docker compose run --rm server-api npx prisma migrate deploy; then
    echo "✅ Áp dụng Prisma Migrations thành công!"
  else
    echo "❌ Lỗi: Prisma Migration thất bại!"
    rollback
  fi
fi

# 4. Khởi động lại các container API & Worker
echo "🔄 Khởi động lại container server-api & server-worker..."
docker compose up -d --force-recreate server-api server-worker

# 5. Đợi container khởi động và kiểm tra Healthcheck (Liveness)
echo "🩺 Đang kiểm tra trạng thái sức khỏe container (tối đa 45s)..."
RETRIES=15
HEALTH_OK=false
until [[ "$RETRIES" -le 0 ]]; do
  STATUS=$(docker inspect --format='{{json .State.Health.Status}}' interviewcoach-api 2>/dev/null || echo '"starting"')
  if [[ "$STATUS" == '"healthy"' ]]; then
    echo "✅ Container interviewcoach-api đã HEALTHY và sẵn sàng!"
    HEALTH_OK=true
    break
  fi
  echo "   Đang chờ container ready... ($STATUS) còn $RETRIES lần thử"
  sleep 3
  RETRIES=$((RETRIES - 1))
done

if [[ "$HEALTH_OK" == false ]]; then
  echo "❌ Lỗi: Container không đạt trạng thái healthy sau 45s. Chi tiết logs gần nhất:"
  docker compose logs --tail=50 server-api
  rollback
fi

# 6. Kiểm tra HTTP Health Endpoint Probe (/health)
echo "🩺 Đang kiểm tra HTTP probe (/health)..."
PROBE_RETRIES=10
PROBE_OK=false
until [[ "$PROBE_RETRIES" -le 0 ]]; do
  if docker compose exec -T server-api node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "✅ Endpoint /health phản hồi HTTP 200 OK!"
    PROBE_OK=true
    break
  fi
  echo "   Đang chờ HTTP probe... còn $PROBE_RETRIES lần thử"
  sleep 3
  PROBE_RETRIES=$((PROBE_RETRIES - 1))
done

if [[ "$PROBE_OK" == false ]]; then
  echo "❌ Lỗi: Endpoint /health không phản hồi thành công sau deploy. Chi tiết logs:"
  docker compose logs --tail=50 server-api
  rollback
fi

# 7. Dọn dẹp an toàn Docker host để chống tràn đĩa VPS
echo "🧹 Đang dọn dẹp image rác và BuildKit cache thừa..."
docker image prune -f

if docker builder prune -f --keep-storage 2GB 2>/dev/null; then
  echo "✅ Đã dọn dẹp BuildKit cache (giữ lại max 2GB)."
else
  docker builder prune -f --filter "until=48h" 2>/dev/null || true
fi

# 8. Báo cáo tình trạng ổ đĩa Docker
echo "📊 Tình trạng dung lượng Docker trên VPS:"
docker system df

echo "=================================================="
echo "🎉 DEPLOY HOÀN TẤT THÀNH CÔNG TRÊN VPS!"
echo "=================================================="
