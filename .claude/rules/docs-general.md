---
paths:
  - "docs/**/*.md"
---

## When to Read
- Before adding requirement → docs/srs.md, docs/discovery.md
- Before writing user story → docs/user-stories/README.md (template)
- Before any change → docs/PHASES.md (current phase context)

## Conventions
- Markdown only. No HTML embeds unless absolutely needed.
- Heading hierarchy: # for doc title, ## for major sections, ### for subsections. Don't skip levels.
- Lists: use - (hyphen). Numbered lists only when order matters.
- Code in code blocks with language tag (```sql, ```python).
- Diagrams: Mermaid only (not images). Inline in markdown.
- Tables for structured comparisons (3+ items with same attributes).
- Links: relative paths for internal docs (../design/db.md), full URL for external.

## ID Conventions
- Functional req: FR-<3 digits> (FR-001, FR-002, ...)
- Non-functional req: NFR-<3 digits>
- User story: US-<3 digits>
- Test case: TC-<3 digits>
- ADR: ADR-<3 digits>
- IDs are immutable once assigned. Never renumber.

## Don't
- Don't paste raw stakeholder quotes longer than 1 sentence — paraphrase + cite.
- Don't include screenshots/images for now (until UI/UX phase).
- Don't predict implementation details. ("Use Redis cache" belongs in design phase, not SRS.)
