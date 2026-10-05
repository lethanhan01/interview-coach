import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from '../context/request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['X-Request-ID'] as string) ||
      randomUUID();

    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['X-Correlation-ID'] as string) ||
      requestId;

    req.headers['x-request-id'] = requestId;
    req.headers['x-correlation-id'] = correlationId;

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);

    RequestContext.run(
      {
        requestId,
        correlationId,
        startTime: Date.now(),
      },
      () => next(),
    );
  }
}
