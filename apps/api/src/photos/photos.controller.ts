import { BadRequestException, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { MembershipService } from '../business/membership.service';
import { CloudinaryService, MAX_PHOTO_BYTES } from './cloudinary.service';

interface UploadedPhoto {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Carica una foto e restituisce l'URL. Non cambia il sito: la foto entra nei dati
 * con una modifica normale (copertina, galleria, foto di una voce), quindi annullabile.
 */
@Controller('businesses/:businessId/photos')
@UseGuards(JwtGuard)
export class PhotosController {
  constructor(
    private readonly membership: MembershipService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  async upload(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string, @UploadedFile() file?: UploadedPhoto) {
    await this.membership.roleOf(u.id, businessId);
    if (!file) throw new BadRequestException('Nessuna foto ricevuta');
    return { url: await this.cloudinary.upload(file.buffer, file.mimetype, businessId) };
  }
}
