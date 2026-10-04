import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { createE2eTestApp } from './helpers/e2e-app';

describe('UserModule & CandidateProfileModule HTTP E2E Contracts', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanupApp: () => Promise<void>;

  let candidateCookie: string[];
  let candidateUserId: string;
  let adminCookie: string[];

  const candidateEmail = `test-cand-${Date.now()}@example.com`;
  const adminEmail = `test-admin-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const context = await createE2eTestApp();
    app = context.app;
    prisma = context.prisma;
    cleanupApp = context.cleanup;

    // 1. Đăng ký tài khoản candidate
    const candRegister = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: candidateEmail,
        password: testPassword,
        firstname: 'Nguyen',
        lastname: 'An',
      })
      .expect(201);

    candidateCookie = candRegister.headers['set-cookie'];
    candidateUserId = candRegister.body.data.id;

    // 2. Đăng ký tài khoản và đổi role sang admin để test 403 Forbidden
    const adminRegister = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: testPassword,
        firstname: 'Admin',
        lastname: 'Super',
      })
      .expect(201);

    const adminUserId = adminRegister.body.data.id;
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'admin' },
    });

    // Login lại để lấy cookie với role admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminEmail,
        password: testPassword,
      })
      .expect(200);

    adminCookie = adminLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    try {
      if (candidateUserId) {
        await prisma.userProfile
          .deleteMany({
            where: { userId: { in: [candidateUserId] } },
          })
          .catch(() => undefined);
      }
      await prisma.user
        .deleteMany({
          where: { email: { in: [candidateEmail, adminEmail] } },
        })
        .catch(() => undefined);
    } finally {
      if (cleanupApp) {
        await cleanupApp().catch(() => undefined);
      }
    }
  });

  describe('UserModule: /api/v1/users/me', () => {
    it('TC-BE-01: Trả về 401 Unauthorized khi truy cập không có cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'UNAUTHORIZED',
      });
    });

    it('TC-BE-02: Trả về 200 OK và đúng DTO, không lộ mật khẩu/tokenVersion', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Cookie', candidateCookie)
        .expect(200);

      expect(res.body).toMatchObject({
        id: candidateUserId,
        email: candidateEmail,
        firstname: 'Nguyen',
        lastname: 'An',
        role: 'candidate',
        status: 'active',
      });
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.tokenVersion).toBeUndefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it('TC-BE-03: Cập nhật họ tên thành công với PATCH /api/v1/users/me', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Cookie', candidateCookie)
        .send({
          firstname: 'Minh An',
          lastname: 'Tran',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        id: candidateUserId,
        firstname: 'Minh An',
        lastname: 'Tran',
      });

      // Verify đọc lại
      const verifyRes = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Cookie', candidateCookie)
        .expect(200);

      expect(verifyRes.body.firstname).toBe('Minh An');
      expect(verifyRes.body.lastname).toBe('Tran');
    });

    it('TC-BE-04: Trả về 400 Bad Request khi candidate truyền tên rỗng hoặc whitespace', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Cookie', candidateCookie)
        .send({
          firstname: '   ',
        })
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'VALIDATION_ERROR',
      });
    });
  });

  describe('CandidateProfileModule: /api/v1/candidate-profile', () => {
    it('TC-BE-05: Trả về 401 Unauthorized khi truy cập không có cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidate-profile')
        .expect(401);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'UNAUTHORIZED',
      });
    });

    it('TC-BE-06: Trả về 403 Forbidden khi user role là admin gọi vào candidate profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidate-profile')
        .set('Cookie', adminCookie)
        .expect(403);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'FORBIDDEN',
      });
    });

    it('TC-BE-07: Trả về 200 OK với profile trống khi candidate mới đăng ký', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidate-profile')
        .set('Cookie', candidateCookie)
        .expect(200);

      expect(res.body).toMatchObject({
        id: candidateUserId,
        email: candidateEmail,
      });
    });

    it('TC-BE-08: Upsert hồ sơ thành công với PATCH /api/v1/candidate-profile', async () => {
      const patchPayload = {
        targetPosition: 'Fullstack Developer',
        targetLevel: 'junior',
        technicalSkills: [
          { name: 'NestJS', category: 'framework', usagePeriod: 12 },
          { name: 'TypeScript', category: 'language', usagePeriod: 12 },
        ],
      };

      const res = await request(app.getHttpServer())
        .patch('/api/v1/candidate-profile')
        .set('Cookie', candidateCookie)
        .send(patchPayload)
        .expect(200);

      expect(res.body.profile).toMatchObject({
        targetPosition: 'Fullstack Developer',
        targetLevel: 'junior',
      });
      expect(res.body.profile.technicalSkills).toHaveLength(2);

      // Verify đọc lại bằng GET
      const verifyRes = await request(app.getHttpServer())
        .get('/api/v1/candidate-profile')
        .set('Cookie', candidateCookie)
        .expect(200);

      expect(verifyRes.body.profile.targetPosition).toBe('Fullstack Developer');
      expect(verifyRes.body.profile.targetLevel).toBe('junior');
    });
  });
});
