---
paths:
  - "docs/user-stories/**/*.md"
---

## Format (per story file)

```
# US-XXX: [Short title]

**Persona**: [from docs/discovery.md personas]
**Priority**: MUST / SHOULD / COULD / WON'T  
**Story points**: [TBD until estimation]
**Related FR**: FR-XXX, FR-YYY

## Story
As a [persona],
I want to [capability],
So that [benefit].

## Acceptance Criteria
- AC1: Given..., when..., then...
- AC2: ...
- AC3 (negative): ...

## Notes / Open Questions
- ...
```

## INVEST Check
Every story must satisfy:
- **I**ndependent: minimal dependency on other stories
- **N**egotiable: scope can be discussed
- **V**aluable: clear user/business value
- **E**stimable: enough detail to estimate
- **S**mall: completable in 1 sprint
- **T**estable: AC are concrete

If story fails INVEST check, flag it. Don't silently accept.

## Don't
- Don't write technical tasks as user stories ("Setup database schema" is not a user story).
- Don't skip the "So that" clause — value statement is mandatory.
- Don't write stories without persona — generic "user" usually means missing persona analysis.
