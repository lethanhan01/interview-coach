# Backend Architecture & Conventions Audit Report

> Generated automatically on **2026-10-05T04:45:02.264Z** by `npm run check:conventions:report`.

### Status: ![Status: PASSED](https://img.shields.io/badge/Conventions-PASSED-brightgreen)

## 1. Executive Summary

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Total Files Analyzed** | `302` | ✅ Complete |
| **Rules Evaluated** | `19` | ✅ Complete |
| **Blocking Errors** | `0` | ✅ 0 Errors |
| **Advisory Warnings** | `18` | ⚠️ Review |
| **Analysis Duration** | `818ms` | ⚡ Fast |

## 2. Rule Evaluation Matrix

| Category | Rule ID | Description | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ARCH** | `ARCH_001` | Controller Presentation Isolation | `ERROR` | Active |
| **ARCH** | `ARCH_002` | Core Layer Independence | `ERROR` | Active |
| **ARCH** | `ARCH_003` | Bounded Context Contract Enforcement | `ERROR` | Active |
| **ARCH** | `ARCH_004` | Transaction Boundary Isolation | `ERROR` | Active |
| **PRES** | `PRES_001` | Presentation DTO Explicit Typing | `ERROR` | Active |
| **PRES** | `PRES_002` | DTO Validation Decorators | `ERROR` | Active |
| **PRES** | `PRES_003` | Pagination Query Bound (@Max <= 100) | `ERROR` | Active |
| **PRES** | `PRES_004` | SSE Endpoint Guard & catchError Pipe | `ERROR` | Active |
| **ERR**  | `ERR_001`  | Raw Error Throw Prohibition | `ERROR` | Active |
| **ERR**  | `ERR_002`  | Domain Layer HTTP Exception Prohibition | `ERROR` | Active |
| **ERR**  | `ERR_003`  | Empty Catch Clause / Swallow Detection | `ERROR` | Active |
| **ERR**  | `ERR_004`  | String Error Matching Prohibition | `ERROR` | Active |
| **ERR**  | `ERR_005`  | Root Cause Preservation in Catch Blocks | `WARN`  | Active |
| **INFRA**| `INFRA_001`| Direct Vendor AI SDK Prohibition | `ERROR` | Active |
| **INFRA**| `INFRA_002`| BullMQ Worker Error Boundary Wrapper | `ERROR` | Active |
| **INFRA**| `INFRA_003`| Bootstrap Logger Wire Enforcement | `ERROR` | Active |
| **OBS**  | `OBS_001`  | Direct Console Logging Prohibition | `ERROR` | Active |
| **NAME** | `NAME_001` | Kebab-Case File Naming Convention | `WARN`  | Active |
| **NAME** | `NAME_002` | Class Suffix & PascalCase Alignment | `WARN`  | Active |

## 3. Findings & Violations

The audit discovered **18** violation(s) across the codebase:

| # | Severity | Rule | Location | Violation Message | Remediation |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/openai.gateway.ts:115` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 2 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/openai.gateway.ts:125` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 3 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/openai.gateway.ts:147` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 4 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/openai.gateway.ts:154` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 5 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/openai.gateway.ts:464` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 6 | 🟡 `WARN` | **ERR_005** | `infrastructure/ai/pipelines/base-pipeline.service.ts:65` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 7 | 🟡 `WARN` | **ERR_005** | `infrastructure/storage/local-disk-media-storage.adapter.ts:148` | InterviewAIException instantiated in catch block without { cause: err }. | Pass { cause: err } as options to preserve root cause error stack trace. |
| 8 | 🟡 `WARN` | **ERR_005** | `modules/auth/auth.service.ts:180` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 9 | 🟡 `WARN` | **ERR_005** | `modules/interview-assessment/evaluation/evaluate-answer.service.ts:140` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 10 | 🟡 `WARN` | **ERR_005** | `modules/media/speech-to-text.service.ts:86` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 11 | 🟡 `WARN` | **ERR_005** | `modules/media/speech-to-text.service.ts:174` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 12 | 🟡 `WARN` | **ERR_005** | `modules/media/stream-audio.service.ts:60` | InterviewAIException instantiated in catch block without { cause: err }. | Pass { cause: err } as options to preserve root cause error stack trace. |
| 13 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:94` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 14 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:130` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 15 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:190` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 16 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:234` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 17 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:302` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |
| 18 | 🟡 `WARN` | **ERR_005** | `modules/onet/onet-admin.service.ts:400` | InterviewAIException instantiated in catch block without { cause: error }. | Pass { cause: error } as options to preserve root cause error stack trace. |

## 4. Suppression & Exception Guidelines

If a specific line or file represents an intentional design exception (e.g. an administrative endpoint with higher query limits), you can suppress the checker rule using an inline comment:

```typescript
// convention-ignore: RULE_ID <justification comment>
```

Example:
```typescript
// convention-ignore: PRES_003 Admin requires listing all 1500 ONET occupations
@Max(1500)
limit?: number = 50;
```

---
*Report generated by Backend Conventions Checker Script.*