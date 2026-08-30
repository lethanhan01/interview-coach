/* eslint-disable @typescript-eslint/no-require-imports */
import { resolveRuntimeRole } from './runtime-role';

const processorModules = [
  [
    '../../assessment/assessment.module',
    '../../assessment/feedback/feedback.processor',
    'AssessmentModule',
    'FeedbackProcessor',
  ],
  [
    '../../modules/interview-prep/question-generation/question-generation.module',
    '../../modules/interview-prep/question-generation/question-generation.processor',
    'QuestionGenerationModule',
    'QuestionGenerationProcessor',
  ],
  [
    '../../report/report.module',
    '../../report/comprehensive-report.processor',
    'ReportModule',
    'ComprehensiveReportProcessor',
  ],
  [
    '../../modules/media/media.module',
    '../../modules/media/transcription.processor',
    'MediaModule',
    'TranscriptionProcessor',
  ],
] as const;

describe('resolveRuntimeRole', () => {
  it.each(['api', 'worker', 'all'] as const)('accepts %s', (role) => {
    expect(resolveRuntimeRole([], { RUNTIME_ROLE: role })).toBe(role);
  });

  it('keeps WORKERS_ENABLED=false as the API-only compatibility mode', () => {
    expect(resolveRuntimeRole([], { WORKERS_ENABLED: 'false' })).toBe('api');
  });

  it('lets the command override the environment', () => {
    expect(
      resolveRuntimeRole(['node', 'main', '--role=worker'], {
        RUNTIME_ROLE: 'api',
      }),
    ).toBe('worker');
  });

  it('registers queue processors only outside the API role', () => {
    const originalRole = process.env.RUNTIME_ROLE;
    try {
      process.env.RUNTIME_ROLE = 'api';
      jest.resetModules();
      for (const [
        modulePath,
        providerPath,
        moduleName,
        providerName,
      ] of processorModules) {
        const module = require(modulePath);
        const provider = require(providerPath);
        expect(
          Reflect.getMetadata('providers', module[moduleName]),
        ).not.toContain(provider[providerName]);
      }

      process.env.RUNTIME_ROLE = 'worker';
      jest.resetModules();
      for (const [
        modulePath,
        providerPath,
        moduleName,
        providerName,
      ] of processorModules) {
        const module = require(modulePath);
        const provider = require(providerPath);
        expect(Reflect.getMetadata('providers', module[moduleName])).toContain(
          provider[providerName],
        );
      }
    } finally {
      if (originalRole === undefined) delete process.env.RUNTIME_ROLE;
      else process.env.RUNTIME_ROLE = originalRole;
      jest.resetModules();
    }
  });

  it('does not start the outbox reconciler in the API role', () => {
    const originalRole = process.env.RUNTIME_ROLE;
    try {
      process.env.RUNTIME_ROLE = 'api';
      jest.resetModules();
      const {
        WorkflowDispatcher,
      } = require('../../infrastructure/workflow/workflow-dispatcher.service');
      const dispatcher = new WorkflowDispatcher({}, {}, {});
      const reconcile = jest.spyOn(dispatcher, 'reconcile');

      dispatcher.onApplicationBootstrap();

      expect(reconcile).not.toHaveBeenCalled();
    } finally {
      if (originalRole === undefined) delete process.env.RUNTIME_ROLE;
      else process.env.RUNTIME_ROLE = originalRole;
      jest.resetModules();
    }
  });
});
