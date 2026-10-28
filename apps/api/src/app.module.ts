import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { ChangesModule } from './changes/changes.module';
import { PagesModule } from './pages/pages.module';
import { PublicModule } from './public/public.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { PhotosModule } from './photos/photos.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, BusinessModule, ChangesModule, PagesModule, PublicModule, WhatsAppModule, PhotosModule],
  controllers: [HealthController],
})
export class AppModule {}
