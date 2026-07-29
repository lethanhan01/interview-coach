import type { ExecutionContext } from '@nestjs/common';
import { ErrorCode } from '../exceptions/error-code.enum';
import { MaintenanceModeGuard } from './maintenance-mode.guard';

describe('MaintenanceModeGuard', () => {
  const contextFor = (method: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  }) as unknown as ExecutionContext;

  it('allows reads and blocks writes when maintenance mode is enabled', () => {
    const guard = new MaintenanceModeGuard({ get: () => 'true' } as never);

    expect(guard.canActivate(contextFor('GET'))).toBe(true);
    expect(() => guard.canActivate(contextFor('POST'))).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.MAINTENANCE_MODE }),
    );
  });

  it('allows writes when maintenance mode is disabled', () => {
    const guard = new MaintenanceModeGuard({ get: () => 'false' } as never);

    expect(guard.canActivate(contextFor('PATCH'))).toBe(true);
  });
});
