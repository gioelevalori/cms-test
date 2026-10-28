import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../photos/cloudinary.service';
import { WhatsAppClient } from './whatsapp.client';

/** Porta una foto ricevuta su WhatsApp su Cloudinary e restituisce l'URL da mettere nei dati. */
@Injectable()
export class WhatsAppMediaService {
  constructor(private readonly client: WhatsAppClient, private readonly cloudinary: CloudinaryService) {}

  get enabled(): boolean {
    return this.cloudinary.configured;
  }

  async toCloudinary(mediaId: string, businessId: string): Promise<string> {
    const { data, mimetype } = await this.client.downloadMedia(mediaId);
    return this.cloudinary.upload(data, mimetype, businessId);
  }
}
