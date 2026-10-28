import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Carica le foto su Cloudinary e restituisce l'URL https da salvare nei dati.
 * Configurazione: CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> (dal pannello Cloudinary).
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return this.credentials() !== null;
  }

  async upload(file: Buffer, mimetype: string, businessId: string): Promise<string> {
    if (!PHOTO_TYPES.includes(mimetype)) throw new BadRequestException('Formato non supportato: usa una foto JPG, PNG, WebP o HEIC');
    if (file.length > MAX_PHOTO_BYTES) throw new BadRequestException('La foto è troppo grande (massimo 10 MB)');
    const c = this.credentials();
    if (!c) throw new ServiceUnavailableException('Le foto non sono ancora attive: manca CLOUDINARY_URL sul server');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `cms/${businessId}`;
    // Firma Cloudinary: parametri in ordine alfabetico + api_secret, SHA-1.
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${c.secret}`).digest('hex');
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file)], { type: mimetype }));
    form.append('api_key', c.key);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const res = await fetch(`${this.base()}/v1_1/${c.cloud}/image/upload`, { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) });
    const body = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
    if (!res.ok || !body.secure_url) {
      this.logger.warn(`Caricamento su Cloudinary fallito (HTTP ${res.status}): ${body.error?.message ?? 'risposta senza URL'}`);
      throw new ServiceUnavailableException('Non sono riuscito a caricare la foto, riprova tra poco');
    }
    return body.secure_url;
  }

  private base() {
    return this.config.get<string>('CLOUDINARY_API_BASE') ?? 'https://api.cloudinary.com';
  }

  private credentials(): { key: string; secret: string; cloud: string } | null {
    const url = this.config.get<string>('CLOUDINARY_URL');
    const m = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@([\w-]+)$/);
    return m ? { key: m[1], secret: m[2], cloud: m[3] } : null;
  }
}
