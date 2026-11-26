# PHÂN HỆ INFRASTRUCTURE, DEVOPS & DISASTER RECOVERY (INFRA-DEVOPS)

> **Trạng thái**: 🟡 Planned (Dự kiến chuẩn hóa sau khi hoàn thành Phase 5)  
> **Cấp độ**: Functional Subsystem Specification  
> **Áp dụng cho**: `.github/workflows/`, `docker-compose*.yml`, Scripts vận hành & Sao lưu dự phòng  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Tài liệu Kế hoạch Triển khai**: [docs/refactor-docs/05_DEV_OPS_INFRA_AND_DISASTER_RECOVERY.md](../../refactor-docs/05_DEV_OPS_INFRA_AND_DISASTER_RECOVERY.md)  

---

## 1. TỔNG QUAN PHÂN HỆ DỰ KIẾN
Phân hệ Infrastructure, DevOps & Disaster Recovery chịu trách nhiệm:
1. **CI/CD Pipeline Polyglot Thông minh**: Quy trình GitHub Actions Matrix với bộ lọc `dorny/paths-filter`, chỉ kích hoạt kiểm thử cho các package/thư mục bị thay đổi, tích hợp kiểm thử hợp đồng tự động (Automated Contract Testing).
2. **Containerization Chuẩn Production**: Đóng gói Docker Compose đa cấu hình (CPU staging và GPU production), quản lý tài nguyên và mạng cô lập.
3. **Chiến lược Sao lưu & Khôi phục Sau Thảm họa (Disaster Recovery)**: Kịch bản sao lưu PostgreSQL định kỳ, cơ chế tự động phục hồi kết nối Redis và xử lý sự cố rớt mạng liên dịch vụ.
4. **Giám sát & Cảnh báo (Observability)**: Tích hợp Prometheus metrics, Grafana dashboards, và thu thập log tập trung.

*Ghi chú: Thư mục này sẽ được chuẩn hóa thành Living Documentation đầy đủ các sơ đồ, onboarding guide và cẩm nang vận hành ngay sau khi Phase 5 vượt qua Quality Gate 5.*
