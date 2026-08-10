# Runtime and queue operations

Deploy the same image as two independently scalable roles:

- API: `npm run start:api` or `node dist/main --role=api`. It exposes HTTP routes and registers queue producers, but no processors or outbox dispatcher.
- Worker: `npm run start:worker` or `node dist/main --role=worker`. It consumes all four queues and runs the outbox dispatcher, but opens no HTTP listener.
- Compatibility: `npm run start:all` preserves the former combined runtime. `WORKERS_ENABLED=false` remains an API-only compatibility setting when `RUNTIME_ROLE` is unset.

`GET /health` is the API readiness probe: it verifies PostgreSQL and Redis and returns the active role. A worker is ready after its process remains running and has connected to PostgreSQL and Redis during bootstrap.

| Queue                  |                                  Concurrency | Attempts / backoff | Retention                                            |
| ---------------------- | -------------------------------------------: | ------------------ | ---------------------------------------------------- |
| `question-generation`  |                                            1 | 2 / 2 seconds      | completed: 1 day or 1,000; failed: 30 days or 10,000 |
| `feedback`             | 2 by default (`FEEDBACK_WORKER_CONCURRENCY`) | 2 / 2 seconds      | completed: 1 day or 1,000; failed: 30 days or 10,000 |
| `comprehensive-report` |                                            1 | 3 / 3 seconds      | completed: 1 day or 1,000; failed: 30 days or 10,000 |
| `transcription`        |                                            1 | 2 / 3 seconds      | completed: 1 day or 1,000; failed: 30 days or 10,000 |

Provider calls use their configured `OPENAI_*_TIMEOUT_MS` limits. BullMQ v5 does not provide a reliable per-job wall-clock timeout, so the worker relies on those bounded provider calls and its retry policy.

Failed jobs stay in BullMQ for the retention period. Inspect the payload and error, correct the cause, then replay with `await queue.getJob(jobId)` followed by `await job.retry()`. Workflow outbox commands use the replay procedure documented in `BACKEND_REFACTORING_PROGRESS.md`; deterministic job IDs make that replay safe.
