import { Module } from '@nestjs/common';
import { ChangesModule } from '../changes/changes.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppLinkController } from './whatsapp-link.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppClient } from './whatsapp.client';
import { WhatsAppQueueService } from './whatsapp-queue.service';

@Module({ imports: [ChangesModule], controllers: [WhatsAppController, WhatsAppLinkController], providers: [WhatsAppService, WhatsAppClient, WhatsAppQueueService] })
export class WhatsAppModule {}
