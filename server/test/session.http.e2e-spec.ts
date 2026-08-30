import '../test/e2e-env';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { provisionDefaultRubricCatalog } from '../src/modules/interview-assessment/evaluation/rubric/rubric-catalog-provision';
import { prisma as seedPrisma } from '../prisma/seed/_client';

describe('session HTTP contracts', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let catalogBeforeBoot: { id: string; checksum: string | null }[];

  beforeAll(async () => {
    await provisionDefaultRubricCatalog(seedPrisma);
    catalogBeforeBoot = await seedPrisma.rubricVersion.findMany({
      select: { id: true, checksum: true },
      orderBy: { id: 'asc' },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);
    await expect(
      prisma.rubricVersion.findMany({
        select: { id: true, checksum: true },
        orderBy: { id: 'asc' },
      }),
    ).resolves.toEqual(catalogBeforeBoot);
  });

  afterAll(async () => {
    await app.close();
    await seedPrisma.$disconnect();
  });

  it('keeps the Session, Turn, Report, Rubric, and SSE-auth HTTP contracts', async () => {
    const email = `phase0-${Date.now()}@example.com`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'phase0-test-password',
        firstname: 'Phase',
        lastname: 'Zero',
      })
      .expect(201);

    expect(register.body).toMatchObject({ success: true, data: { email } });
    const cookie = register.headers['set-cookie'][0];
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const savedJob = await prisma.savedJobDescription.create({
      data: {
        userId: user.id,
        companyName: 'Contract Co',
        jobTitle: 'Backend Engineer',
        requirements:
          'TypeScript, PostgreSQL, and practical testing experience.',
        jobContent: 'Build and maintain backend services.',
      },
    });

    const created = await request(app.getHttpServer())
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        jobDescription:
          'We need a backend engineer with strong TypeScript, PostgreSQL, Redis, testing, and production operations experience for this contract test role.',
        sessionType: 'technical',
        contextPack: 'VN',
        savedJobDescriptionId: savedJob.id,
        numQuestions: 3,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      status: 'generating',
      sessionType: 'technical',
      numQuestions: 3,
    });

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/status`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ status: 'generating', numQuestions: 3 });

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/questions`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ questions: [], currentIndex: 0 });

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/report`)
      .set('Cookie', cookie)
      .expect(202);

    const rubric = await request(app.getHttpServer())
      .get('/api/v1/rubrics/VN?sessionType=technical')
      .set('Cookie', cookie)
      .expect(200);
    expect(rubric.body).toMatchObject({
      contextPackId: 'VN',
      sessionType: 'technical',
    });

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/events`)
      .expect(401);

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/events`)
      .set('Cookie', 'interviewcoach_auth=invalid-token')
      .expect(401);

    const otherUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `phase0-other-${Date.now()}@example.com`,
        password: 'phase0-test-password',
        firstname: 'Other',
        lastname: 'User',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/sessions/${created.body.id}/events`)
      .set('Cookie', otherUser.headers['set-cookie'][0])
      .expect(403);

    const firstQuestion = await prisma.sessionQuestion.create({
      data: {
        sessionId: created.body.id,
        questionText: 'Describe a production incident you resolved.',
        orderIndex: 1,
        questionCategory: 'technical',
      },
    });
    const criterion = await prisma.rubricCriterion.findFirstOrThrow({
      where: { rubricCategory: { rubricVersion: { contextPackId: 'VN' } } },
    });
    await prisma.sessionQuestionCriterion.create({
      data: {
        sessionQuestionId: firstQuestion.id,
        rubricCriterionId: criterion.id,
      },
    });
    await prisma.interviewSession.update({
      where: { id: created.body.id },
      data: { status: 'active' },
    });

    const textTurn = await request(app.getHttpServer())
      .post(`/api/v1/sessions/${created.body.id}/turns`)
      .set('Cookie', cookie)
      .send({
        questionId: firstQuestion.id,
        answerMode: 'text',
        answerText:
          'I isolated the failing dependency and restored traffic safely.',
      })
      .expect(201);
    expect(textTurn.body).toMatchObject({
      feedbackQueued: true,
      transcriptionPending: false,
    });

    const voiceQuestion = await prisma.sessionQuestion.create({
      data: {
        sessionId: created.body.id,
        questionText: 'Explain your deployment rollback process.',
        orderIndex: 2,
        questionCategory: 'technical',
      },
    });
    const voiceTurn = await request(app.getHttpServer())
      .post(`/api/v1/sessions/${created.body.id}/turns`)
      .set('Cookie', cookie)
      .send({
        questionId: voiceQuestion.id,
        answerMode: 'voice',
        audioFileUrl: 'https://example.com/answer.webm',
      })
      .expect(201);
    expect(voiceTurn.body).toMatchObject({
      feedbackQueued: false,
      transcriptionPending: true,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/sessions/${created.body.id}/turns/audio`)
      .set('Cookie', cookie)
      .expect(400);
  });

  it('does not expose credentials from the profile endpoint', async () => {
    const email = `profile-contract-${Date.now()}@example.com`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'profile-contract-password',
        firstname: 'Profile',
        lastname: 'Contract',
      })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Cookie', register.headers['set-cookie'][0])
      .expect(200);

    expect(profile.body).toMatchObject({ id: expect.any(String), email });
    expect(profile.body).not.toHaveProperty('passwordHash');
    expect(profile.body).not.toHaveProperty('tokenVersion');
  });
});
