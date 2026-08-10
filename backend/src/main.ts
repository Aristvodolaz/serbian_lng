import 'reflect-metadata';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
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
