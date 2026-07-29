import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { createMockConfigService } from '../../test-utils/mock-factories';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const mockConfig = createMockConfigService({
      SUPABASE_JWT_SECRET: 'test-secret-key-for-unit-tests',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('returns an unauthoritative user placeholder for legacy strategy compatibility', () => {
      const payload = {
        sub: 'user-uuid-123',
        email: 'test@example.com',
        iat: 1000,
        exp: 2000,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-uuid-123',
        email: 'test@example.com',
        role: 'user',
        emailVerified: false,
      });
    });
  });
});
