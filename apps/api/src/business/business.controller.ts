import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './business.dto';

@Controller('businesses')
@UseGuards(JwtGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.businesses.listForUser(u.id);
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateBusinessDto) {
    return this.businesses.create(u.id, dto);
  }

  @Get(':businessId')
  get(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string) {
    return this.businesses.get(u.id, businessId);
  }
}
