import { resolveAppliedDimensions } from './dimension-matcher';
import type { RubricDimensionEntry } from '../context-pack.service';

// Dimension data thật từ VN pack (context-pack.data.ts)
const VN_BEHAVIORAL: RubricDimensionEntry[] = [
  { id: 'D1', name: 'Giao tiếp & Trình bày', weight: 0.2 },
  { id: 'D2', name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
  { id: 'D3', name: 'Làm việc nhóm', weight: 0.15 },
  { id: 'D4', name: 'Thái độ & Động lực', weight: 0.2 },
  { id: 'D5', name: 'Phù hợp văn hóa', weight: 0.15 },
  { id: 'D6', name: 'Tự nhận thức', weight: 0.1 },
];

const VN_TECHNICAL: RubricDimensionEntry[] = [
  { id: 'TD1', name: 'Kiến thức nền tảng', weight: 0.25 },
  { id: 'TD2', name: 'Khả năng áp dụng thực tế', weight: 0.25 },
  { id: 'TD3', name: 'Tư duy hệ thống', weight: 0.2 },
  { id: 'TD4', name: 'Code quality & Best practices', weight: 0.2 },
  { id: 'TD5', name: 'Debug & Problem-solving', weight: 0.1 },
];

describe('resolveAppliedDimensions', () => {
  describe('Branch 1 — exact ID match', () => {
    it('khớp "D1" chính xác → trả D1', () => {
      const result = resolveAppliedDimensions([{ id: 'D1', score: 80 }], VN_BEHAVIORAL);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'D1',
        name: 'Giao tiếp & Trình bày',
        baseWeight: 0.2,
        score: 80,
        matchBranch: 'exact',
      });
    });

    it('khớp "TD1" chính xác với technical dims', () => {
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 70 }], VN_TECHNICAL);
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'exact' });
    });
  });

  describe('Branch 2 — normalized ID match (case, whitespace, dash)', () => {
    it('"d1" (lowercase) → D1', () => {
      const result = resolveAppliedDimensions([{ id: 'd1', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('"D-1" (có dấu gạch) → D1', () => {
      const result = resolveAppliedDimensions([{ id: 'D-1', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('" D1 " (có khoảng trắng) → D1', () => {
      const result = resolveAppliedDimensions([{ id: ' D1 ', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('"td1" (technical lowercase) → TD1 trong mixed dims', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions([{ id: 'td1', score: 70 }], mixed);
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'normId' });
    });
  });

  describe('Branch 3 — regex code extraction', () => {
    it('"D1: Giao tiếp & Trình bày" → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1: Giao tiếp & Trình bày', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'code' });
    });

    it('"D1 Communication" → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1 Communication', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'code' });
    });

    it('"TD1: Kiến thức nền tảng" → TD1 trong mixed dims', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions(
        [{ id: 'TD1: Kiến thức nền tảng', score: 70 }],
        mixed,
      );
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'code' });
    });

    it('TD1 không nhầm thành D1 — regex T?D ưu tiên bắt T', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 70 }], mixed);
      expect(result[0].id).toBe('TD1');
    });
  });

  describe('Branch 4 — name normalize match', () => {
    it('"Giao tiếp & Trình bày" (tên đầy đủ có dấu) → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'Giao tiếp & Trình bày', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'name' });
    });

    it('"lam viec nhom" (tên không dấu) → D3', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'lam viec nhom', score: 70 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D3', matchBranch: 'name' });
    });
  });

  describe('Session type filtering', () => {
    it('TD1 với HR dims → [] (technical không có trong behavioral)', () => {
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 80 }], VN_BEHAVIORAL);
      expect(result).toHaveLength(0);
    });

    it('mixed dims → nhận cả D1 (behavioral) và TD1 (technical)', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'TD1', score: 70 }],
        mixed,
      );
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.id)).toEqual(['D1', 'TD1']);
    });
  });

  describe('Dedup', () => {
    it('duplicate cùng ID: giữ entry đầu tiên (score 80), bỏ entry sau (score 60)', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'D1', score: 60 }],
        VN_BEHAVIORAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(80);
    });

    it('duplicate qua normalize ("D1" và "d1"): giữ entry đầu tiên', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'd1', score: 60 }],
        VN_BEHAVIORAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('D1');
      expect(result[0].score).toBe(80);
    });
  });

  describe('Edge cases — không bao giờ throw', () => {
    it('id bịa "ZZ" → []', () => {
      expect(resolveAppliedDimensions([{ id: 'ZZ', score: 50 }], VN_BEHAVIORAL)).toHaveLength(0);
    });

    it('id inventé "communication" không khớp tên VN → []', () => {
      expect(
        resolveAppliedDimensions([{ id: 'communication', score: 80 }], VN_BEHAVIORAL),
      ).toHaveLength(0);
    });

    it('applied rỗng → []', () => {
      expect(resolveAppliedDimensions([], VN_BEHAVIORAL)).toHaveLength(0);
    });

    it('allowedDims rỗng → []', () => {
      expect(resolveAppliedDimensions([{ id: 'D1', score: 80 }], [])).toHaveLength(0);
    });

    it('id là chuỗi rỗng → không throw', () => {
      expect(() =>
        resolveAppliedDimensions([{ id: '', score: 1 }], VN_BEHAVIORAL),
      ).not.toThrow();
    });

    it('id là ký tự đặc biệt → không throw', () => {
      expect(() =>
        resolveAppliedDimensions([{ id: '???!!!', score: 50 }], []),
      ).not.toThrow();
    });
  });
});
