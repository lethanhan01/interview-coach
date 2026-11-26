import { NestFactory } from '@nestjs/core';
import {
  INestApplicationContext,
  Logger,
  LoggerService,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { exec } from 'node:child_process';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { setupSwagger } from '@core/common/swagger/swagger';
import { resolveRuntimeRole } from '@core/runtime/runtime-role';
import { registerProcessErrorHandlers } from '@core/runtime/process-error-handlers';
import { validationErrorFactory } from '@core/common/pipes/validation-error.factory';
import { AppLogger } from '@core/common/services/app-logger.service';

let activeApp: INestApplicationContext | undefined;
let activeLogger: LoggerService = new Logger('Bootstrap');

registerProcessErrorHandlers({
  logger: {
    error: (message, trace, context) => {
      activeLogger.error(message, trace, context);
    },
    warn: (message, context) => {
      activeLogger.warn(message, context);
    },
  },
  getApp: () => activeApp,
});

async function bootstrap() {
  const runtimeRole = resolveRuntimeRole();
  if (runtimeRole === 'worker') {
    const app = await NestFactory.createApplicationContext(AppModule, {
      bufferLogs: true,
    });
    activeApp = app;
    const appLogger = app.get(AppLogger);
    activeLogger = appLogger;
    app.useLogger(appLogger);
    app.enableShutdownHooks();
    return;
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  activeApp = app;
  const appLogger = app.get(AppLogger);
  activeLogger = appLogger;
  app.useLogger(appLogger);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationErrorFactory,
    }),
  );
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.use(cookieParser());
  if (process.env.NODE_ENV !== 'production') setupSwagger(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.OPEN_SWAGGER === 'true'
  ) {
    const url = `http://localhost:${port}/api/docs`;
    const command =
      process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(command);
  }
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  activeLogger.error(`Application bootstrap failed: ${message}`, stack);
  process.exit(1);
});
