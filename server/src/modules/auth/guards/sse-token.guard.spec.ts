import { ExecutionContext } from '@nestjs/common';
import { SseTokenGuard } from './sse-token.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('SseTokenGuard', () => {
  it('delegates SSE authentication to the normal JWT guard', async () => {
    const canActivate = jest.fn().mockResolvedValue(true);
    const jwt = {
      canActivate,
    } as unknown as JwtAuthGuard;
    const guard = new SseTokenGuard(jwt);
    const context = {} as ExecutionContext;
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(canActivate).toHaveBeenCalledWith(context);
  });
});
