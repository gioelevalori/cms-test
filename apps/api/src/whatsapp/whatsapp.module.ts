import { Module } from '@nestjs/common';
import { ChangesModule } from '../changes/changes.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppClient } from './whatsapp.client';

@Module({ imports: [ChangesModule], controllers: [WhatsAppController], providers: [WhatsAppService, WhatsAppClient] })
export class WhatsAppModule {}
