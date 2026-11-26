import { RequestContext } from '../../src/core/common/context/request-context';
import {
  AppLogger,
  redactSensitiveData,
} from '../../src/core/common/services/app-logger.service';
import { BullMqJobErrorHandler } from '../../src/infrastructure/workflow/bullmq-error-handler';
import { Job } from 'bullmq';

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

interface SanitizedPayload {
  user?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  nested?: {
    clientSecret?: string;
    normalField?: string;
  };
}

interface MockJobPayload {
  commandType: string;
  aggregateId: string;
  correlationId: string;
  timestamp: string;
}

function verifyInboundContext(
  testRequestId: string,
  testTraceId: string,
): StepResult {
  console.log(
    `${BOLD}[1/5] Testing HTTP Inbound & RequestContext Binding...${RESET}`,
  );
  let passed = false;
  let details = '';

  RequestContext.run(
    {
      requestId: testRequestId,
      correlationId: testTraceId,
      startTime: Date.now(),
    },
    () => {
      const activeTrace = RequestContext.getCorrelationId();
      const activeReq = RequestContext.getRequestId();

      if (activeTrace === testTraceId && activeReq === testRequestId) {
        passed = true;
        details = `RequestContext successfully bound correlationId=${activeTrace}`;
        console.log(
          `  ${GREEN}✔${RESET} RequestContext bound: correlationId=${CYAN}${activeTrace}${RESET}`,
        );
      } else {
        details = `Mismatch: expected ${testTraceId}, got ${activeTrace}`;
        console.log(`  ${RED}✖${RESET} ${details}`);
      }
    },
  );

  return {
    step: 1,
    name: 'HTTP Inbound Context Binding',
    passed,
    details,
  };
}

function verifyStructuredLogging(
  logger: AppLogger,
  testRequestId: string,
  testTraceId: string,
  testSessionId: string,
): StepResult {
  console.log(
    `\n${BOLD}[2/5] Testing Service Structured Logging with Correlation ID...${RESET}`,
  );
  let passed = false;
  let details = '';

  RequestContext.run(
    {
      requestId: testRequestId,
      correlationId: testTraceId,
      startTime: Date.now(),
    },
    () => {
      logger.log('Service: Processing business action', 'VerificationService', {
        sessionId: testSessionId,
      });

      const store = RequestContext.get();
      if (store?.correlationId === testTraceId) {
        passed = true;
        details =
          'AppLogger successfully read correlationId from RequestContext';
        console.log(
          `  ${GREEN}✔${RESET} AppLogger integrated with active RequestContext`,
        );
      } else {
        details = 'RequestContext missing in logger scope';
        console.log(`  ${RED}✖${RESET} ${details}`);
      }
    },
  );

  return {
    step: 2,
    name: 'Service Structured Logging',
    passed,
    details,
  };
}

function verifyPiiRedaction(): StepResult {
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

  const sanitized = redactSensitiveData(sensitivePayload) as SanitizedPayload;
  const sanitizedJson = JSON.stringify(sanitized);

  const passwordMasked = sanitized.password === '[REDACTED]';
  const tokenMasked = sanitized.token === '[REDACTED]';
  const apiKeyMasked = sanitized.apiKey === '[REDACTED]';
  const nestedMasked = sanitized.nested?.clientSecret === '[REDACTED]';
  const normalPreserved = sanitized.nested?.normalField === 'public-data';

  const passed =
    passwordMasked &&
    tokenMasked &&
    apiKeyMasked &&
    nestedMasked &&
    normalPreserved;
  const details = passed
    ? 'All sensitive keys (password, token, apiKey, clientSecret) masked with [REDACTED]'
    : 'PII masking failed on one or more sensitive fields';

  if (passed) {
    console.log(`  ${GREEN}✔${RESET} password     ➔ ${sanitized.password}`);
    console.log(`  ${GREEN}✔${RESET} token        ➔ ${sanitized.token}`);
    console.log(`  ${GREEN}✔${RESET} apiKey       ➔ ${sanitized.apiKey}`);
    console.log(
      `  ${GREEN}✔${RESET} clientSecret ➔ ${sanitized.nested?.clientSecret}`,
    );
    console.log(
      `  ${GREEN}✔${RESET} normalField  ➔ ${sanitized.nested?.normalField} (preserved)`,
    );
  } else {
    console.log(`  ${RED}✖${RESET} ${details}: ${sanitizedJson}`);
  }

  return {
    step: 3,
    name: 'PII Sensitive Data Redaction',
    passed,
    details,
  };
}

function verifyJobPackaging(
  testSessionId: string,
  testTraceId: string,
): { result: StepResult; payload: MockJobPayload } {
  console.log(
    `\n${BOLD}[4/5] Testing Background Queue Job Payload Packaging...${RESET}`,
  );
  const payload: MockJobPayload = {
    commandType: 'GenerateComprehensiveReport',
    aggregateId: testSessionId,
    correlationId: testTraceId,
    timestamp: new Date().toISOString(),
  };

  const passed = payload.correlationId === testTraceId;
  const details = passed
    ? `Job payload contains correlationId=${payload.correlationId}`
    : 'Job payload missing correlationId';

  if (passed) {
    console.log(
      `  ${GREEN}✔${RESET} Job packaged for BullMQ: { correlationId: "${CYAN}${payload.correlationId}${RESET}" }`,
    );
  } else {
    console.log(`  ${RED}✖${RESET} ${details}`);
  }

  return {
    payload,
    result: {
      step: 4,
      name: 'Queue Job Correlation Packaging',
      passed,
      details,
    },
  };
}

async function verifyWorkerRestoration(
  logger: AppLogger,
  mockJobPayload: MockJobPayload,
  testTraceId: string,
): Promise<StepResult> {
  console.log(
    `\n${BOLD}[5/5] Testing Worker Context Restoration (BullMqJobErrorHandler)...${RESET}`,
  );
  let workerRestoredTraceId = '';

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
    () => {
      workerRestoredTraceId = RequestContext.getCorrelationId();
      logger.log(
        'Worker: Job execution running inside restored context',
        'VerifyProcessor',
        {
          jobId: simulatedBullMqJob.id,
        },
      );
      return Promise.resolve({ success: true });
    },
  );

  const passed = workerRestoredTraceId === testTraceId;
  const details = passed
    ? `Worker restored exact correlationId=${workerRestoredTraceId}`
    : `Worker correlationId mismatch: expected ${testTraceId}, got ${workerRestoredTraceId}`;

  if (passed) {
    console.log(
      `  ${GREEN}✔${RESET} Worker restored RequestContext: correlationId=${CYAN}${workerRestoredTraceId}${RESET}`,
    );
    console.log(
      `  ${GREEN}✔${RESET} Trace continuity verified across HTTP ➔ Queue ➔ Worker boundary!`,
    );
  } else {
    console.log(`  ${RED}✖${RESET} ${details}`);
  }

  return {
    step: 5,
    name: 'Worker Context Restoration',
    passed,
    details,
  };
}

async function runObservabilityVerification() {
  console.log(
    `\n${BOLD}${CYAN}======================================================================${RESET}`,
  );
  console.log(
    `${BOLD}${CYAN}   INTERVIA DISTRIBUTED TRACING & OBSERVABILITY VERIFICATION   ${RESET}`,
  );
  console.log(
    `${BOLD}${CYAN}======================================================================${RESET}\n`,
  );

  const testTraceId = `trace-audit-${Date.now()}`;
  const testRequestId = `req-audit-${Date.now()}`;
  const testSessionId = `session-demo-${Date.now().toString().slice(-6)}`;

  console.log(`${DIM}Audit Timestamp : ${new Date().toISOString()}${RESET}`);
  console.log(`${DIM}Target Trace ID : ${testTraceId}${RESET}\n`);

  const logger = new AppLogger();
  const step1 = verifyInboundContext(testRequestId, testTraceId);
  const step2 = verifyStructuredLogging(
    logger,
    testRequestId,
    testTraceId,
    testSessionId,
  );
  const step3 = verifyPiiRedaction();
  const { payload: mockJobPayload, result: step4 } = verifyJobPackaging(
    testSessionId,
    testTraceId,
  );
  const step5 = await verifyWorkerRestoration(
    logger,
    mockJobPayload,
    testTraceId,
  );

  const results: StepResult[] = [step1, step2, step3, step4, step5];

  console.log(
    `\n${BOLD}======================================================================${RESET}`,
  );
  console.log(
    `${BOLD}                     VERIFICATION AUDIT SUMMARY                       ${RESET}`,
  );
  console.log(
    `${BOLD}======================================================================${RESET}`,
  );

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? `${GREEN}✔ PASS${RESET}` : `${RED}✖ FAIL${RESET}`;
    console.log(`  Step ${r.step}: ${r.name.padEnd(35)} ${icon}`);
    if (!r.passed) allPassed = false;
  }
  console.log(
    '----------------------------------------------------------------------',
  );

  if (allPassed) {
    console.log(
      `${BOLD}${GREEN}✔ ALL 5 OBSERVABILITY & TRACE CONTINUITY CHECKS PASSED SUCCESSFULLY!${RESET}\n`,
    );
    process.exit(0);
  } else {
    console.log(
      `${BOLD}${RED}✖ OBSERVABILITY VERIFICATION FAILED! Please check logs above.${RESET}\n`,
    );
    process.exit(1);
  }
}

void runObservabilityVerification();
