---
paths:
  - "docs/srs.md"
  - "docs/srs/**/*.md"
---

## Structure (loosely based on IEEE 830, adapted)
1. Introduction (Purpose, Scope, Definitions, References)
2. Overall Description (Product perspective, Functions, User characteristics, Constraints, Assumptions)
3. Specific Requirements
   - 3.1 Functional Requirements (grouped by feature)
   - 3.2 External Interface Requirements (User, Hardware, Software, Communication)
   - 3.3 Non-Functional Requirements (Performance, Security, Usability, Reliability, Scalability)
   - 3.4 Other Requirements (Legal, Localization, etc.)
4. Appendices

## Functional Requirement Format
Each FR must have:
- ID: FR-XXX
- Name: short imperative ("System shall allow user to...")
- Description: 2-4 sentences
- Priority: MUST / SHOULD / COULD / WON'T
- Source: <stakeholder/discovery section>
- Dependencies: list of other FR-IDs (or "None")
- Acceptance Criteria: Given-When-Then format, ≥1 positive + ≥1 negative scenario
- Related US: link to user story IDs

Example template (collapsed):
```
### FR-001: User uploads CV
**Priority**: MUST  
**Source**: Discovery §2.1, Stakeholder: Job Seeker  
**Dependencies**: None  
**Description**: System shall allow authenticated user to upload CV in PDF or DOCX format, max 5MB.  
**Acceptance Criteria**:
- AC1 (positive): Given authenticated user, when user uploads valid PDF (<5MB), then file is stored and parsed within 10s.
- AC2 (negative): Given authenticated user, when user uploads .exe file, then system rejects with error "Unsupported format".
- AC3 (boundary): Given file size = 5MB exactly, then upload succeeds.
**Related US**: US-001, US-003
```

## Non-Functional Requirement Format
NFR must have measurable criterion. Examples:
- ❌ "System shall be fast"
- ✅ "p95 latency for /api/interview/turn shall be < 800ms under 100 concurrent users"
- ❌ "System shall be secure"
- ✅ "All API endpoints requiring auth shall reject requests without valid JWT within 50ms"

## Don't
- Don't write FR that prescribes implementation ("Use OAuth 2.0" is design, not requirement).
- Don't combine multiple requirements in one FR. Split into FR-001a, FR-001b if needed.
- Don't leave acceptance criteria as TODO when committing the FR.
