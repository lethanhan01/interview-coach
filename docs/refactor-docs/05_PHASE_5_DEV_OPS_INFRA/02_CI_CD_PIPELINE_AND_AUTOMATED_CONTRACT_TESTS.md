# TASK 5.2: CI/CD PIPELINE MONOREPO & KIỂM THỬ HỢP ĐỒNG ĐA NGÔN NGỮ
# (GITHUB ACTIONS MATRIX, PATH-BASED FILTERING, AUTOMATED CONTRACT SPEC TESTING)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (CI/CD Automation & Contract Integrity)  
> **Áp dụng cho**: `.github/workflows/`, GitHub Actions, TypeScript DTOs, Pydantic Schemas  
> **Tài liệu cha**: [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Trong một kiến trúc Monorepo đa ngôn ngữ (TypeScript và Python), quy trình CI/CD ban đầu bộc lộ **3 thiếu sót mang tính rủi ro cao**:

1. **Lãng Phí Tài Nguyên Runner do Thiếu Path-Based Filtering**:
   * Khi lập trình viên chỉ sửa giao diện CSS ở `client/`, hệ thống CI lại chạy toàn bộ bài test AI Python và cài đặt PyTorch, tiêu tốn 15-20 phút không cần thiết.
   * *Giải pháp khắc phục*: Sử dụng `dorny/paths-filter` để phát hiện chính xác vùng thay đổi và chỉ kích hoạt job kiểm thử tương ứng.
2. **Hiểm Họa Lệch Hợp Đồng Dữ Liệu Ngầm (Silent Schema/Contract Drift)**:
   * NestJS sử dụng TypeScript DTO (`class-validator`), trong khi Python sử dụng `pydantic.BaseModel`. Nếu một bên sửa tên trường (ví dụ: `relevanceScore` thành `relevance_score` hoặc đổi kiểu dữ liệu) mà bên kia chưa đồng bộ, hệ thống sẽ sập lỗi HTTP 500 khi gọi REST trên môi trường Production!
   * *Giải pháp khắc phục*: Thiết lập **Contract Verification Suite** bắt buộc: Dùng chung một kho Wire JSON Fixtures duy nhất để cả TypeScript và Python cùng xác thực tính tương thích schema trước khi cho phép merge PR.
3. **Thiếu Bước Kiểm Thử Tính Toàn Vẹn của Migration CSDL**:
   * Không kiểm tra xem `prisma migrate deploy` có áp dụng thành công trên một cơ sở dữ liệu thật hay không, dẫn đến lỗi migration làm nghẽn tiến trình deploy production.

---

## 2. QUY TRÌNH KIỂM THỬ HỢP ĐỒNG DỮ LIỆU ĐA NGÔN NGỮ (CONTRACT TESTING)

Để đảm bảo hai ngôn ngữ luôn ăn khớp 100% về giao thức truyền nhận:

```mermaid
graph TD
    Shared["Thư mục Chung: contracts/fixtures/<br/>(rag-response.fixture.json, assess-payload.fixture.json)"]
    
    subgraph NestJSTest["TypeScript Side (server/)"]
        Jest["Jest Contract Spec<br/>(test/contracts/*.spec.ts)"]
        LoadTS["loadJsonFixture() -> plainToInstance(DTO)"]
        ValTS["validateSync(dto).length === 0"]
    end
    
    subgraph PythonTest["Python Side (ai-service/)"]
        Pytest["Pytest Contract Spec<br/>(tests/test_contracts.py)"]
        LoadPy["load_fixture() -> Model(**fixture)"]
        ValPy["model.model_dump(by_alias=True) matches fixture"]
    end
    
    Shared --> LoadTS
    LoadTS --> ValTS
    Shared --> LoadPy
    LoadPy --> ValPy
    
    ValTS --> Gate{"CI Gate: Cả 2 cùng PASS?"}
    ValPy --> Gate
    Gate -->|YES| MergeAllowed["Cho phép Merge PR"]
    Gate -->|NO| BlockPR["CHẶN MERGE: Phát hiện Schema Drift!"]
```

---

## 3. CẤU HÌNH GITHUB ACTIONS WORKFLOW CHI TIẾT (`.github/workflows/ci.yml`)

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 1. Phát hiện thư mục có thay đổi
  changes:
    runs-on: ubuntu-latest
    outputs:
      client: ${{ steps.filter.outputs.client }}
      server: ${{ steps.filter.outputs.server }}
      ai_service: ${{ steps.filter.outputs.ai_service }}
      contracts: ${{ steps.filter.outputs.contracts }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            client:
              - 'client/**'
            server:
              - 'server/**'
            ai_service:
              - 'ai-service/**'
            contracts:
              - 'contracts/**'
              - 'server/src/**/dto/**'
              - 'ai-service/app/schemas/**'

  # 2. Kiểm thử hợp đồng đa ngôn ngữ (Bắt buộc chạy nếu sửa server, ai-service hoặc contracts)
  contract-tests:
    needs: changes
    if: ${{ needs.changes.outputs.contracts == 'true' || needs.changes.outputs.server == 'true' || needs.changes.outputs.ai_service == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js for NestJS Contract Tests
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'server/package-lock.json'
      
      - name: Setup Python with uv
        uses: astral-sh/setup-uv@v3
        with:
          version: 'latest'

      - name: Run NestJS Contract Tests
        working-directory: ./server
        run: |
          npm ci
          npm run test:contracts

      - name: Run Python Pydantic Contract Tests
        working-directory: ./ai-service
        run: |
          uv pip install -r pyproject.toml --system
          pytest tests/test_contracts.py

  # 3. Kiểm thử NestJS Backend
  test-server:
    needs: changes
    if: ${{ needs.changes.outputs.server == 'true' }}
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'server/package-lock.json'
      - name: Install & Run Tests
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://testuser:testpassword@localhost:5432/testdb
        run: |
          npm ci
          npx prisma migrate deploy
          npm run lint
          npm run test

  # 4. Kiểm thử Python AI Service
  test-ai-service:
    needs: changes
    if: ${{ needs.changes.outputs.ai_service == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - name: Run Python Lint & Pytest
        working-directory: ./ai-service
        run: |
          uv pip install -r pyproject.toml --extra-index-url https://download.pytorch.org/whl/cpu --system
          ruff check .
          pytest tests/unit
```

---

## 4. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Kháng Lệch Schema Tuyệt Đối (Zero Contract Drift)**: Bất kỳ sự thay đổi nào về trường dữ liệu hoặc kiểu dữ liệu trong DTO/Schema mà không cập nhật fixture tương ứng sẽ bị CI đánh dấu đỏ và chặn merge 100%.
2. **Tối Ưu Thời Gian Chạy CI**: Thời gian hoàn tất luồng CI cho một Pull Request thông thường $< 4\text{ phút}$.
3. **Độc Lập Mã Nguồn**: Sự cố kiểm thử ở `client/` không ngăn chặn việc kiểm tra tính đúng đắn của `ai-service/`.
