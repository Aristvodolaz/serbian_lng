import 'reflect-metadata';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const INSECURE_DEFAULTS = ['change-me-access-secret', 'change-me-refresh-secret'];

// Local dev falls back to placeholder secrets for convenience — refuse to
// boot with those (or with them missing) once actually running in prod.
function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
  }

  const insecure = INSECURE_DEFAULTS.filter(
    (value) => process.env.JWT_ACCESS_SECRET === value || process.env.JWT_REFRESH_SECRET === value,
  );
  if (insecure.length > 0) {
    throw new Error('JWT secrets are still set to the local-dev placeholder values — set real secrets.');
  }
}

async function bootstrap() {
  assertProductionEnv();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('REČ API')
    .setDescription(
      'Backend for REČ — a Serbian language learning app. Dual-script (ćirilica/latinica) lessons, vocabulary review and progress tracking for the Android/iOS clients.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('auth', 'Registration, login, token refresh')
    .addTag('users', 'Profile, stats, weekly activity')
    .addTag('units', 'Lesson path (units and lessons)')
    .addTag('lessons', 'Lesson detail, exercises, completion')
    .addTag('vocabulary', 'Flashcard review queue and spaced repetition')
    .addTag('badges', 'Achievement catalog and earned badges')
    .addTag('admin', 'Admin panel operations (requires admin role)')
    .addTag('health', 'Liveness check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Kept in sync with the code on every boot — mobile client codegen can read this file directly.
  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`REČ API listening on :${port} — docs at /api/docs`);
}

bootstrap();
