---
name: weekly-report
description: Tạo báo cáo tổng quan tiến độ tuần dạng outcome-oriented cho stakeholder không phải dev. Use khi user nói "báo cáo tuần", "weekly report", "tóm tắt tuần này", "tuần qua đã làm gì", "weekly summary", hoặc yêu cầu báo cáo theo khoảng thời gian. Tự đọc git log + branch activity + uncommitted work, group theo feature/module, sinh file markdown vào reports/weekly/YYYY-Www.md theo template chuẩn.
allowed-tools: Read, Grep, Glob, Bash(git log*), Bash(git shortlog*), Bash(git diff*), Bash(git branch*), Bash(git status*), Bash(git rev-parse*), Bash(date*), Bash(mkdir*), Write
model: claude-sonnet-4-6
---

# Weekly Progress Report

Vai trò: bạn là project lead viết báo cáo tuần cho stakeholder KHÔNG phải dev. Họ
không đọc git log — họ muốn biết "có gì mới + có vấn đề gì + tuần sau tập trung gì".

## Quy trình

### 1. Xác định khoảng thời gian
- Mặc định: 7 ngày trước → hôm nay
- Nếu user chỉ định ("from Monday", "tuần trước", "2 tuần qua") → đổi theo
- Lấy tuần ISO: `date +%G-W%V` (vd: 2026-W19)

### 2. Thu thập dữ liệu (chạy SONG SONG khi có thể)

Chạy các lệnh sau, lưu output để phân tích:

```bash
# Commits trong khoảng — full info
git log --since='7 days ago' --pretty=format:'%h|%an|%ad|%s' --date=short --all

# Tổng commit per author
git shortlog -sn --since='7 days ago' --all

# Tổng dòng thay đổi vs main
git diff --shortstat $(git merge-base HEAD origin/main)...HEAD 2>/dev/null || echo "no main"

# Branches active gần đây
git branch -a --sort=-committerdate | head -20

# Uncommitted work hiện tại
git status --short

# File thay đổi nhiều nhất (signal "có thể đang khó")
git log --since='7 days ago' --name-only --pretty=format:'' | grep -v '^$' | sort | uniq -c | sort -rn | head -15

# WIP / hack / fixme commits (signal blocker)
git log --since='7 days ago' --grep='wip\|hack\|fixme\|todo\|temp\|revert' -i --oneline
```

### 3. Phân tích — TUYỆT ĐỐI không liệt kê commit nguyên văn

- **Group commits theo FEATURE/MODULE**, không theo thứ tự thời gian. Suy ra module
  từ path file thay đổi (vd: `src/auth/*` → "Authentication", `src/payment/*` → "Payment")
- **Map commit → outcome cho người không code**:
  - ❌ "refactored auth middleware"
  - ✅ "đăng nhập nhanh hơn ~40%, ít lỗi 401 hơn"
- **Đếm theo loại**: feature mới / bug fix / refactor / docs / tests / chore
  (đọc commit message + đoán theo conventional commits nếu có: feat/fix/refactor/...)
- **Phát hiện churn**: file xuất hiện trong commit ≥ 3 ngày liên tiếp → đánh dấu
  "có thể đang gặp khó với X" trong phần Notes
- **Phát hiện risk**: WIP/hack/revert commits → flag trong Blockers
- **Đọc uncommitted work**: nếu git status có file đáng kể → ghi vào "In Progress"

### 4. Đọc template
Đọc `@.claude/skills/weekly-report/template.md` và điền vào.

### 5. Lưu file
- Đường dẫn: `reports/weekly/{YEAR}-W{ISO_WEEK}.md` (vd: `reports/weekly/2026-W19.md`)
- Nếu thư mục chưa có: `mkdir -p reports/weekly`
- Nếu file đã tồn tại (chạy lại trong tuần): show diff, hỏi overwrite/append/cancel
- KHÔNG thêm vào .gitignore — báo cáo là asset, nên commit

### 6. Output cho user
- Link tới file vừa tạo
- TL;DR 3 dòng (copy từ phần TL;DR của file)
- Cảnh báo nếu data thưa (vd: < 5 commits cả tuần → "Repo có ít hoạt động tuần này")

## Nguyên tắc viết

- **Đối tượng**: PM/manager/founder — KHÔNG phải dev đồng nghiệp
- **Outcome language**: bỏ jargon kỹ thuật. Refactor → "ổn định hơn"; migration → "dữ liệu cũ vẫn dùng được"
- **Số liệu cụ thể** khi có (X commits, Y PRs, Z bugs fixed) — nhưng KHÔNG dùng "lines of code" làm metric chính (wc -l không phản ánh giá trị)
- **Mỗi mục ≤ 5 bullets** — nhiều hơn → gom nhóm
- **Blocker phải có 3 phần**: vấn đề + ảnh hưởng + cần gì để gỡ
- **Next Week phải actionable**: có owner + Definition of Done
- **Tổng độ dài ≤ 1 trang A4** (~ 400 dòng markdown)

## Tuyệt đối không

- Liệt kê commit nguyên văn (đó là git log, không phải report)
- Báo cáo "lines of code added" như metric chính
- Bịa achievement không có trong git history
- Skip phần Blockers vì "không thấy gì" — luôn check uncommitted + WIP commits + churn
- Báo cáo cá nhân hoá theo author trừ khi user yêu cầu (focus vào project, không phải individual)
- Viết quá 1 trang

## Mở rộng (nếu repo có)

- **CHANGELOG.md** → đối chiếu, đảm bảo achievement quan trọng đã được note
- **GitHub/Linear/Jira MCP** đã connect → kéo thêm: PRs merged, issues closed, sprint progress
- **CI/CD logs** → thêm dòng "Deployments: N to staging, M to prod"
