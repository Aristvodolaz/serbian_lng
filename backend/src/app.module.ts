import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import typeormConfig from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { BadgesModule } from './badges/badges.module';
import { AdminModule } from './admin/admin.module';
import { TtsModule } from './tts/tts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeormConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<TypeOrmModuleOptions>('typeorm')!,
    }),
    AuthModule,
    UsersModule,
    ContentModule,
    VocabularyModule,
    BadgesModule,
    AdminModule,
    TtsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
