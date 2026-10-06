import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('trả về giá trị mặc định khi chưa có store trong context', () => {
    expect(RequestContext.get()).toBeUndefined();
    expect(RequestContext.getCorrelationId()).toBe('no-correlation-id');
    expect(RequestContext.getRequestId()).toBe('no-request-id');
    expect(RequestContext.getUserId()).toBeUndefined();
  });

  it('lưu trữ và truy xuất thông tin chính xác trong RequestContext.run()', () => {
    const store = {
      requestId: 'req-123',
      correlationId: 'corr-456',
      userId: 'usr-789',
      startTime: 1000,
    };

    RequestContext.run(store, () => {
      expect(RequestContext.get()).toEqual(store);
      expect(RequestContext.getCorrelationId()).toBe('corr-456');
      expect(RequestContext.getRequestId()).toBe('req-123');
      expect(RequestContext.getUserId()).toBe('usr-789');
    });
  });

  it('cô lập dữ liệu giữa các execution context bất đồng bộ', async () => {
    const taskA = new Promise<string>((resolve) => {
      void RequestContext.run(
        {
          requestId: 'req-A',
          correlationId: 'corr-A',
          startTime: Date.now(),
        },
        async () => {
          await new Promise((r) => setTimeout(r, 20));
          resolve(RequestContext.getCorrelationId());
        },
      );
    });

    const taskB = new Promise<string>((resolve) => {
      void RequestContext.run(
        {
          requestId: 'req-B',
          correlationId: 'corr-B',
          startTime: Date.now(),
        },
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          resolve(RequestContext.getCorrelationId());
        },
      );
    });

    const [resultA, resultB] = await Promise.all([taskA, taskB]);
    expect(resultA).toBe('corr-A');
    expect(resultB).toBe('corr-B');
  });

  it('cập nhật userId qua setUserId khi đã ở trong context', () => {
    RequestContext.run(
      {
        requestId: 'req-auth',
        correlationId: 'corr-auth',
        startTime: Date.now(),
      },
      () => {
        expect(RequestContext.getUserId()).toBeUndefined();
        RequestContext.setUserId('user-authenticated-456');
        expect(RequestContext.getUserId()).toBe('user-authenticated-456');
      },
    );
  });
});
