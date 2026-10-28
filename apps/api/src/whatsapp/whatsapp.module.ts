import { Module } from '@nestjs/common';
import { ChangesModule } from '../changes/changes.module';
import { PhotosModule } from '../photos/photos.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppLinkController } from './whatsapp-link.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppClient } from './whatsapp.client';
import { WhatsAppMediaService } from './whatsapp-media.service';
import { WhatsAppQueueService } from './whatsapp-queue.service';

@Module({
  imports: [ChangesModule, PhotosModule],
  controllers: [WhatsAppController, WhatsAppLinkController],
  providers: [WhatsAppService, WhatsAppClient, WhatsAppMediaService, WhatsAppQueueService],
})
export class WhatsAppModule {}
