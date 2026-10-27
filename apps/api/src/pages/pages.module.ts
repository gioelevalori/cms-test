import { Module } from '@nestjs/common';
import { SitesModule } from '../sites/sites.module';
import { PagesService } from './pages.service';
import { PagesController, PublicPagesController } from './pages.controller';

@Module({ imports: [SitesModule], providers: [PagesService], controllers: [PagesController, PublicPagesController] })
export class PagesModule {}
