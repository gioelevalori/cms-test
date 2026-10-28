import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module';
import { CloudinaryService } from './cloudinary.service';
import { PhotosController } from './photos.controller';

@Module({ imports: [BusinessModule], controllers: [PhotosController], providers: [CloudinaryService], exports: [CloudinaryService] })
export class PhotosModule {}
