import { Module } from '@nestjs/common';
import { ChangesModule } from '../changes/changes.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppLinkController } from './whatsapp-link.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppClient } from './whatsapp.client';

@Module({ imports: [ChangesModule], controllers: [WhatsAppController, WhatsAppLinkController], providers: [WhatsAppService, WhatsAppClient] })
export class WhatsAppModule {}
