# UI/UX Design — InterviewAI

Design reference: Final Round AI 3-panel layout (Interviewer Transcript | AI Suggestions | Interviewee Transcript).

## Contents

- [01_overview.md](01_overview.md) — Sitemap (11 routes), screen inventory, design system tokens, WCAG 2.1 AA
- [02_flows_auth_setup.md](02_flows_auth_setup.md) — UC-01 (Google auth), UC-12 (JD input + session config)
- [03_flows_interview.md](03_flows_interview.md) — UC-03/04/06/07 (interview flows, SSE event mapping)
- [04_flows_features.md](04_flows_features.md) — Surgical feedback, rewrite, report, progress dashboard

## Conventions

- Mermaid diagrams cho flows, không images
- Screens = route → page component (HLD §2.2.1)
- Design tokens: Tailwind CSS defaults (color/spacing/typography)
- Accessibility: WCAG 2.1 AA baseline, không hardcode màu