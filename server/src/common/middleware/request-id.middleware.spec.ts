import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('sử dụng x-request-id đã có trong header thay vì tạo mới', () => {
    const existingId = 'existing-request-id-123';
    const req = { headers: { 'x-request-id': existingId } } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(next).toHaveBeenCalled();
  });

  it('tạo request ID mới khi x-request-id không có trong header', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    const assignedId = req.headers['x-request-id'] as string;
    expect(typeof assignedId).toBe('string');
    expect(assignedId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', assignedId);
    expect(next).toHaveBeenCalled();
  });
});
