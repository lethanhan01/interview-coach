import { EventEmitter } from 'node:events';
import type { INestApplicationContext } from '@nestjs/common';
import { registerProcessErrorHandlers } from './process-error-handlers';

describe('registerProcessErrorHandlers', () => {
  let fakeProcess: EventEmitter;
  let logger: { error: jest.Mock; warn: jest.Mock };
  let exit: jest.Mock;

  beforeEach(() => {
    fakeProcess = new EventEmitter();
    logger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    exit = jest.fn();
  });

  it('ghi log và giữ server sống khi gặp unhandledRejection', () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const unregister = registerProcessErrorHandlers({
      logger,
      getApp: () => ({ close }) as unknown as INestApplicationContext,
      exit,
      proc: fakeProcess as unknown as NodeJS.Process,
    });

    fakeProcess.emit(
      'unhandledRejection',
      new Error('Stray rejected promise'),
      Promise.resolve(),
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unhandled Promise Rejection'),
      expect.any(String),
      'ProcessErrorHandlers',
    );
    expect(close).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    unregister();
  });

  it('đóng app gọn gàng và thoát exit(1) khi gặp uncaughtException', async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const unregister = registerProcessErrorHandlers({
      logger,
      getApp: () => ({ close }) as unknown as INestApplicationContext,
      exit,
      shutdownTimeoutMs: 5_000,
      proc: fakeProcess as unknown as NodeJS.Process,
    });

    fakeProcess.emit(
      'uncaughtException',
      new Error('Fatal crash'),
      'uncaughtException',
    );
    // Second concurrent uncaughtException must not re-trigger app.close()
    fakeProcess.emit(
      'uncaughtException',
      new Error('Secondary crash'),
      'uncaughtException',
    );

    await new Promise((resolve) => setImmediate(resolve));

    expect(close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
    unregister();
  });

  it('ép thoát exit(1) nếu app.close() treo vượt quá shutdownTimeoutMs', () => {
    jest.useFakeTimers();
    const neverResolvingClose = jest.fn(() => new Promise<void>(() => {}));
    const unregister = registerProcessErrorHandlers({
      logger,
      getApp: () =>
        ({ close: neverResolvingClose }) as unknown as INestApplicationContext,
      exit,
      shutdownTimeoutMs: 2_000,
      proc: fakeProcess as unknown as NodeJS.Process,
    });

    fakeProcess.emit(
      'uncaughtException',
      new Error('Hung shutdown'),
      'uncaughtException',
    );

    expect(exit).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2_000);
    expect(exit).toHaveBeenCalledWith(1);

    unregister();
    jest.useRealTimers();
  });

  it('thoát ngay exit(1) nếu uncaughtException xảy ra trước khi app khởi tạo', () => {
    const unregister = registerProcessErrorHandlers({
      logger,
      getApp: () => undefined,
      exit,
      proc: fakeProcess as unknown as NodeJS.Process,
    });

    fakeProcess.emit(
      'uncaughtException',
      new Error('Pre-boot crash'),
      'uncaughtException',
    );

    expect(exit).toHaveBeenCalledWith(1);
    unregister();
  });
});
