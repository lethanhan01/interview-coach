# ADR-001: Next.js 14 App Router

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-001 |
| **Ngày** | 09/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

InterviewAI cần một frontend framework cho web app luyện phỏng vấn. Các yêu cầu chính:

- Ghi âm microphone real-time (Web Audio API + MediaRecorder)
- Voice input và text input cho câu trả lời phỏng vấn
- Hiển thị Surgical Feedback với highlight annotation trên transcript
- Authentication qua Google OAuth
- PWA capability (offline fallback, installable)

Các lựa chọn được cân nhắc:
- Next.js 14 (App Router)
- Create React App / Vite + React SPA
- SvelteKit
- Remix

## Decision

**Chọn Next.js 14 với App Router.**

Lý do:

1. **Web Audio API:** Hoạt động natively trong browser — không phụ thuộc vào framework. Next.js hỗ trợ React hooks để manage audio state.
2. **SSR cho SEO:** Landing page và session report cần SSR để index được. App Router hỗ trợ server components và streaming.
3. **NextAuth.js integration:** Google OAuth qua NextAuth với Supabase adapter — ít boilerplate hơn tự implement.
4. **TypeScript ecosystem:** Type sharing với NestJS backend qua shared types package trong monorepo.
5. **Vercel deployment:** Free tier đủ cho prototype; zero-config deploy.

Tại sao không chọn các lựa chọn khác:
- **CRA/Vite SPA:** Không có SSR — landing page và SEO kém hơn. Không cần thiết phức tạp hơn App Router.
- **SvelteKit:** Ecosystem nhỏ hơn; ít tài liệu tiếng Việt/community support.
- **Remix:** App Router của Next.js đã cung cấp tương đương; Remix ít phổ biến hơn trong context này.

## Consequences

**Positive:**

- SSR cho landing page và session report (SEO + initial load performance)
- Server components giảm JS bundle size cho trang static
- NextAuth simplifies Google OAuth implementation

**Negative:**

- App Router có learning curve cao hơn Pages Router
- Server component / client component boundary cần chú ý khi dùng Web Audio API (phải mark `'use client'`)
- Vercel vendor lock-in cho deployment (giảm thiểu bằng cách không dùng Vercel-specific APIs)
