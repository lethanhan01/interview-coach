import { RequestIdMiddleware } from './request-id.middleware';
import { RequestContext } from '../context/request-context';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('sử dụng x-request-id và x-correlation-id đã có trong header thay vì tạo mới', () => {
    const existingId = 'existing-request-id-123';
    const existingCorrId = 'existing-correlation-id-456';
    const req = {
      headers: {
        'x-request-id': existingId,
        'x-correlation-id': existingCorrId,
      },
    } as any;
    const res = { setHeader: jest.fn() } as any;
    let contextCorrId = '';

    const next = jest.fn(() => {
      contextCorrId = RequestContext.getCorrelationId();
    });

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(req.headers['x-correlation-id']).toBe(existingCorrId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      existingCorrId,
    );
    expect(next).toHaveBeenCalled();
    expect(contextCorrId).toBe(existingCorrId);
  });

  it('tạo request ID và correlation ID mới khi không có trong header', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;
    let contextRequestId = '';
    let contextCorrId = '';

    const next = jest.fn(() => {
      contextRequestId = RequestContext.getRequestId();
      contextCorrId = RequestContext.getCorrelationId();
    });

    middleware.use(req, res, next);

    const assignedId = req.headers['x-request-id'] as string;
    const assignedCorrId = req.headers['x-correlation-id'] as string;

    expect(typeof assignedId).toBe('string');
    expect(assignedId.length).toBeGreaterThan(0);
    expect(typeof assignedCorrId).toBe('string');
    expect(assignedCorrId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', assignedId);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      assignedCorrId,
    );
    expect(next).toHaveBeenCalled();
    expect(contextRequestId).toBe(assignedId);
    expect(contextCorrId).toBe(assignedCorrId);
  });
});
