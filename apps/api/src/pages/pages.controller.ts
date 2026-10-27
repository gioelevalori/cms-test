import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { PagesService } from './pages.service';
import { CreatePageDto, SaveDraftDto } from './pages.dto';

@Controller('sites/:siteId/pages')
@UseGuards(JwtGuard)
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string) {
    return this.pages.list(u.id, siteId);
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string, @Body() dto: CreatePageDto) {
    return this.pages.create(u.id, siteId, dto);
  }

  @Get(':pageId')
  get(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string, @Param('pageId') pageId: string) {
    return this.pages.get(u.id, siteId, pageId);
  }

  @Put(':pageId/draft')
  saveDraft(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string, @Param('pageId') pageId: string, @Body() dto: SaveDraftDto) {
    return this.pages.saveDraft(u.id, siteId, pageId, dto.blocks);
  }

  @Post(':pageId/publish')
  publish(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string, @Param('pageId') pageId: string) {
    return this.pages.publish(u.id, siteId, pageId);
  }

  @Get(':pageId/revisions')
  revisions(@CurrentUser() u: AuthUser, @Param('siteId') siteId: string, @Param('pageId') pageId: string) {
    return this.pages.revisions(u.id, siteId, pageId);
  }
}

@Controller('public/sites/:siteSlug/pages')
export class PublicPagesController {
  constructor(private readonly pages: PagesService) {}

  @Get(':pageSlug')
  get(@Param('siteSlug') siteSlug: string, @Param('pageSlug') pageSlug: string) {
    return this.pages.getPublic(siteSlug, pageSlug);
  }
}
