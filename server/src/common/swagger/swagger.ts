import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('InterviewCoach API')
      .setDescription(
        'API test guide: call `POST /auth/login` or `/auth/register` first. The browser then sends the HttpOnly authentication cookie automatically for protected endpoints.',
      )
      .setVersion('1.0')
      .addCookieAuth(
        process.env.AUTH_COOKIE_NAME || 'interviewcoach_auth',
        undefined,
        'cookieAuth',
      )
      .build(),
  );

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
