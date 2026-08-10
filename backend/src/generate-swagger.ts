import 'reflect-metadata';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Generates openapi.json without starting the HTTP listener — for CI/codegen
 * pipelines that only need the spec (e.g. mobile client SDK generation).
 */
async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('REČ API')
    .setDescription(
      'Backend for REČ — a Serbian language learning app. Dual-script (ćirilica/latinica) lessons, vocabulary review and progress tracking for the Android/iOS clients.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log('Wrote openapi.json');
  await app.close();
}

generate();
