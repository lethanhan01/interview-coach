import type { INestApplicationContext, LoggerService } from '@nestjs/common';

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

export interface ProcessErrorHandlerOptions {
  logger: Pick<LoggerService, 'error' | 'warn'>;
  getApp: () => INestApplicationContext | undefined;
  shutdownTimeoutMs?: number;
  exit?: (code: number) => void;
  proc?: Pick<NodeJS.Process, 'on' | 'off'>;
}

export function registerProcessErrorHandlers(
  options: ProcessErrorHandlerOptions,
): () => void {
  const proc = options.proc ?? process;
  const exit = options.exit ?? ((code: number) => process.exit(code));
  const shutdownTimeoutMs =
    options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  let isShuttingDown = false;

  const onUnhandledRejection = (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    options.logger.error(
      `Unhandled Promise Rejection — process kept alive: ${message}`,
      stack,
      'ProcessErrorHandlers',
    );
  };

  const onUncaughtException = (
    error: Error,
    origin: NodeJS.UncaughtExceptionOrigin,
  ) => {
    options.logger.error(
      `Uncaught Exception (${origin}) — initiating graceful shutdown: ${error.message}`,
      error.stack,
      'ProcessErrorHandlers',
    );

    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    const forceExitTimer = setTimeout(() => {
      options.logger.error(
        `Graceful shutdown timed out after ${shutdownTimeoutMs}ms; forcing exit`,
        undefined,
        'ProcessErrorHandlers',
      );
      exit(1);
    }, shutdownTimeoutMs);
    forceExitTimer.unref?.();

    const app = options.getApp();
    if (!app) {
      clearTimeout(forceExitTimer);
      exit(1);
      return;
    }

    void app
      .close()
      .catch((closeError: unknown) => {
        const closeMsg =
          closeError instanceof Error ? closeError.message : String(closeError);
        options.logger.warn(
          `Error while closing Nest application during fatal shutdown: ${closeMsg}`,
          'ProcessErrorHandlers',
        );
      })
      .finally(() => {
        clearTimeout(forceExitTimer);
        exit(1);
      });
  };

  proc.on('unhandledRejection', onUnhandledRejection);
  proc.on('uncaughtException', onUncaughtException);

  return () => {
    proc.off('unhandledRejection', onUnhandledRejection);
    proc.off('uncaughtException', onUncaughtException);
  };
}
