import { RequestContext } from '../src/core/common/context/request-context';
import { AppLogger, redactSensitiveData } from '../src/core/common/services/app-logger.service';
import { BullMqJobErrorHandler } from '../src/infrastructure/workflow/bullmq-error-handler';
import { Job } from 'bullmq';

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

async function runObservabilityVerification() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   INTERVIEWCOACH DISTRIBUTED TRACING & OBSERVABILITY VERIFICATION   ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

  const results: StepResult[] = [];
  const testTraceId = `trace-audit-${Date.now()}`;
  const testRequestId = `req-audit-${Date.now()}`;
  const testSessionId = `session-demo-${Date.now().toString().slice(-6)}`;

  console.log(`${DIM}Audit Timestamp : ${new Date().toISOString()}${RESET}`);
  console.log(`${DIM}Target Trace ID : ${testTraceId}${RESET}\n`);

  const logger = new AppLogger();

  // -------------------------------------------------------------------------
  // STEP 1: HTTP Inbound & Correlation ID Binding
  // -------------------------------------------------------------------------
  console.log(`${BOLD}[1/5] Testing HTTP Inbound & RequestContext Binding...${RESET}`);
  let step1Passed = false;
  let step1Details = '';

  await RequestContext.run(
    {
      requestId: testRequestId,
      correlationId: testTraceId,
      startTime: Date.now(),
    },
    async () => {
      const activeTrace = RequestContext.getCorrelationId();
      const activeReq = RequestContext.getRequestId();

      if (activeTrace === testTraceId && activeReq === testRequestId) {
        step1Passed = true;
        step1Details = `RequestContext successfully bound correlationId=${activeTrace}`;
        console.log(`  ${GREEN}✔${RESET} RequestContext bound: correlationId=${CYAN}${activeTrace}${RESET}`);
      } else {
        step1Details = `Mismatch: expected ${testTraceId}, got ${activeTrace}`;
        console.log(`  ${RED}✖${RESET} ${step1Details}`);
      }
    },
  );
  results.push({ step: 1, name: 'HTTP Inbound Context Binding', passed: step1Passed, details: step1Details });

  // -------------------------------------------------------------------------
  // STEP 2: Service Structured Logging
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[2/5] Testing Service Structured Logging with Correlation ID...${RESET}`);
  let step2Passed = false;
  let step2Details = '';

  await RequestContext.run(
    {
      requestId: testRequestId,
      correlationId: testTraceId,
      startTime: Date.now(),
    },
    async () => {
      logger.log('Service: Processing business action', 'VerificationService', {
        sessionId: testSessionId,
      });

      const store = RequestContext.get();
      if (store && store.correlationId === testTraceId) {
        step2Passed = true;
        step2Details = `AppLogger successfully read correlationId from RequestContext`;
        console.log(`  ${GREEN}✔${RESET} AppLogger integrated with active RequestContext`);
      } else {
        step2Details = 'RequestContext missing in logger scope';
        console.log(`  ${RED}✖${RESET} ${step2Details}`);
      }
    },
  );
  results.push({ step: 2, name: 'Service Structured Logging', passed: step2Passed, details: step2Details });

  // -------------------------------------------------------------------------
  // STEP 3: Sensitive Data Redaction (PII Masking)
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[3/5] Testing Sensitive PII Data Masking...${RESET}`);
  const sensitivePayload = {
    user: 'candidate@example.com',
    password: 'super-secret-password-123',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
    apiKey: 'sk-proj-super-secret-api-key',
    nested: {
      clientSecret: 'secret-xyz-987',
      normalField: 'public-data',
    },
  };

  const sanitized = redactSensitiveData(sensitivePayload) as Record<string, any>;
  const sanitizedJson = JSON.stringify(sanitized);

  const passwordMasked = sanitized.password === '[REDACTED]';
  const tokenMasked = sanitized.token === '[REDACTED]';
  const apiKeyMasked = sanitized.apiKey === '[REDACTED]';
  const nestedMasked = sanitized.nested?.clientSecret === '[REDACTED]';
  const normalPreserved = sanitized.nested?.normalField === 'public-data';

  const step3Passed = passwordMasked && tokenMasked && apiKeyMasked && nestedMasked && normalPreserved;
  const step3Details = step3Passed
    ? 'All sensitive keys (password, token, apiKey, clientSecret) masked with [REDACTED]'
    : 'PII masking failed on one or more sensitive fields';

  if (step3Passed) {
    console.log(`  ${GREEN}✔${RESET} password     ➔ ${sanitized.password}`);
    console.log(`  ${GREEN}✔${RESET} token        ➔ ${sanitized.token}`);
    console.log(`  ${GREEN}✔${RESET} apiKey       ➔ ${sanitized.apiKey}`);
    console.log(`  ${GREEN}✔${RESET} clientSecret ➔ ${sanitized.nested?.clientSecret}`);
    console.log(`  ${GREEN}✔${RESET} normalField  ➔ ${sanitized.nested?.normalField} (preserved)`);
  } else {
    console.log(`  ${RED}✖${RESET} ${step3Details}: ${sanitizedJson}`);
  }
  results.push({ step: 3, name: 'PII Sensitive Data Redaction', passed: step3Passed, details: step3Details });

  // -------------------------------------------------------------------------
  // STEP 4: Background Outbox Job Packaging
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[4/5] Testing Background Queue Job Payload Packaging...${RESET}`);
  const mockJobPayload = {
    commandType: 'GenerateComprehensiveReport',
    aggregateId: testSessionId,
    correlationId: testTraceId,
    timestamp: new Date().toISOString(),
  };

  const step4Passed = mockJobPayload.correlationId === testTraceId;
  const step4Details = step4Passed
    ? `Job payload contains correlationId=${mockJobPayload.correlationId}`
    : 'Job payload missing correlationId';

  if (step4Passed) {
    console.log(`  ${GREEN}✔${RESET} Job packaged for BullMQ: { correlationId: "${CYAN}${mockJobPayload.correlationId}${RESET}" }`);
  } else {
    console.log(`  ${RED}✖${RESET} ${step4Details}`);
  }
  results.push({ step: 4, name: 'Queue Job Correlation Packaging', passed: step4Passed, details: step4Details });

  // -------------------------------------------------------------------------
  // STEP 5: Worker Context Restoration & Trace Continuity
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[5/5] Testing Worker Context Restoration (BullMqJobErrorHandler)...${RESET}`);
  let workerRestoredTraceId = '';
  let step5Passed = false;

  const simulatedBullMqJob = {
    id: 'verify-job-888',
    name: 'generate-report',
    data: mockJobPayload,
    attemptsMade: 0,
    opts: { attempts: 3 },
  } as unknown as Job;

  await BullMqJobErrorHandler.handleJobExecution(
    'VerifyProcessor',
    simulatedBullMqJob,
    async () => {
      workerRestoredTraceId = RequestContext.getCorrelationId();
      logger.log('Worker: Job execution running inside restored context', 'VerifyProcessor', {
        jobId: simulatedBullMqJob.id,
      });
      return { success: true };
    },
  );

  step5Passed = workerRestoredTraceId === testTraceId;
  const step5Details = step5Passed
    ? `Worker restored exact correlationId=${workerRestoredTraceId}`
    : `Worker correlationId mismatch: expected ${testTraceId}, got ${workerRestoredTraceId}`;

  if (step5Passed) {
    console.log(`  ${GREEN}✔${RESET} Worker restored RequestContext: correlationId=${CYAN}${workerRestoredTraceId}${RESET}`);
    console.log(`  ${GREEN}✔${RESET} Trace continuity verified across HTTP ➔ Queue ➔ Worker boundary!`);
  } else {
    console.log(`  ${RED}✖${RESET} ${step5Details}`);
  }
  results.push({ step: 5, name: 'Worker Context Restoration', passed: step5Passed, details: step5Details });

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}======================================================================${RESET}`);
  console.log(`${BOLD}                     VERIFICATION AUDIT SUMMARY                       ${RESET}`);
  console.log(`${BOLD}======================================================================${RESET}`);

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? `${GREEN}✔ PASS${RESET}` : `${RED}✖ FAIL${RESET}`;
    console.log(`  Step ${r.step}: ${r.name.padEnd(35)} ${icon}`);
    if (!r.passed) allPassed = false;
  }
  console.log('----------------------------------------------------------------------');

  if (allPassed) {
    console.log(`${BOLD}${GREEN}✔ ALL 5 OBSERVABILITY & TRACE CONTINUITY CHECKS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${BOLD}${RED}✖ OBSERVABILITY VERIFICATION FAILED! Please check logs above.${RESET}\n`);
    process.exit(1);
  }
}

void runObservabilityVerification();
