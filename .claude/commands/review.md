---
description: Code review tập trung bug + security trên file/PR cụ thể
allowed-tools: Read, Grep, Glob, Bash(git diff*), Bash(git log*)
argument-hint: [file-path-or-pr-number]
---

Bạn là senior code reviewer. Input: $ARGUMENTS

## Bước 1 — Xác định input mode

Nếu $ARGUMENTS chỉ gồm chữ số → đây là PR number. Chạy:
  git diff main...HEAD
  git log main..HEAD --oneline

Nếu $ARGUMENTS là file path → đọc file đó, sau đó chạy:
  git diff main -- $ARGUMENTS
  git log --oneline -10 -- $ARGUMENTS

## Bước 2 — Review theo thứ tự ưu tiên

Kiểm tra lần lượt, ghi nhận từng issue trước khi chuyển sang mục tiếp theo:

### P0 — Critical bugs
- Null/nil dereference, index out of bounds, unhandled exception paths
- Data loss (ghi đè không kiểm tra, xóa không rollback)
- Race conditions, deadlock potential
- Infinite loops hoặc recursion không có base case

### P1 — Security
- Injection: SQL, command, path traversal
- Secrets/credentials hardcoded hoặc logged
- Auth bypass: missing auth check, privilege escalation
- Insecure deserialization, XXE, SSRF
- Sensitive data exposed in response/log

### P2 — Logic errors
- Business logic sai so với spec/comment
- Off-by-one errors
- Sai điều kiện boundary (dùng < thay vì <=)
- State mutation không mong muốn

### P3 — Readability
- Tên biến/hàm misleading
- Magic numbers không có constant/comment
- Function làm >1 việc (vi phạm SRP)
- Dead code, commented-out code

### P4 — Performance
- N+1 query
- Blocking I/O trong hot path
- Không có pagination trên collection lớn
- Memory leak pattern

## Bước 3 — Output

Với mỗi severity level, output theo format:

## Critical (X issues)
- <file>:<line> — <mô tả vấn đề cụ thể> — Fix: <gợi ý ngắn gọn>

## Major (X issues)
- <file>:<line> — <mô tả> — Fix: <gợi ý>

## Minor (X issues)
- <file>:<line> — <mô tả> — Fix: <gợi ý>

Nếu không có issue ở một severity: viết "No issues found at Critical/Major/Minor."

Kết thúc bằng:

## Summary
Reviewed: <file hoặc PR#>
Total: X issues (Critical: N, Major: N, Minor: N)

## Ràng buộc
- KHÔNG sửa code. Report only.
- KHÔNG fabricate issues để có vẻ thorough.
- Nếu code sạch → nói thẳng "No issues found" ở từng level.
- Mỗi finding phải có file:line cụ thể — không được vague.
