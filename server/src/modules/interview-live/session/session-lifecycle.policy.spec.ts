import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';

describe('SessionLifecyclePolicy', () => {
  const policy = new SessionLifecyclePolicy();

  it.each([
    ['generating', 'active'],
    ['ready', 'active'],
    ['paused', 'active'],
    ['active', 'paused'],
    ['ready', 'paused'],
    ['generating', 'canceled'],
    ['active', 'canceled'],
    ['paused', 'canceled'],
    ['active', 'completed'],
  ])('cho phép %s → %s', (current, next) => {
    expect(() => policy.assertTransition(current, next as never)).not.toThrow();
  });

  it.each([
    ['generating', 'completed'],
    ['completed', 'active'],
    ['completed', 'canceled'],
    ['completing', 'canceled'],
    ['canceled', 'active'],
    ['paused', 'completed'],
  ])('từ chối %s → %s', (current, next) => {
    expect(() => policy.assertTransition(current, next as never)).toThrow(
      expect.objectContaining({
        errorCode: ErrorCode.INVALID_SESSION_TRANSITION,
      }),
    );
  });

  it.each(['active', 'paused', 'canceled', 'completed'])(
    'cho phép idempotent %s → %s',
    (status) => {
      expect(() =>
        policy.assertTransition(status, status as never),
      ).not.toThrow();
    },
  );
});
