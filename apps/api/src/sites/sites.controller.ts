import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { SitesService } from './sites.service';
import { CreateSiteDto, UpdateSiteDto } from './sites.dto';

@Controller('sites')
@UseGuards(JwtGuard)
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.sites.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSiteDto) {
    return this.sites.create(user.id, dto);
  }

  @Get(':siteId')
  get(@CurrentUser() user: AuthUser, @Param('siteId') siteId: string) {
    return this.sites.get(user.id, siteId);
  }

  @Patch(':siteId')
  update(@CurrentUser() user: AuthUser, @Param('siteId') siteId: string, @Body() dto: UpdateSiteDto) {
    return this.sites.update(user.id, siteId, dto);
  }
}
