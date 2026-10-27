import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { isValidLayout } from '@cms/shared';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from '../business/membership.service';

class SavePageDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsArray() layout: unknown[];
}

@Controller('businesses/:businessId/pages')
@UseGuards(JwtGuard)
export class PagesController {
  constructor(private readonly prisma: PrismaService, private readonly membership: MembershipService) {}

  @Get()
  async list(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string) {
    await this.membership.roleOf(u.id, businessId);
    return this.prisma.page.findMany({ where: { businessId }, select: { slug: true, title: true, layout: true }, orderBy: { slug: 'asc' } });
  }

  /** Solo owner e builder: il cliente cambia i dati, non la struttura. */
  @Put(':slug')
  async save(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string, @Param('slug') slug: string, @Body() dto: SavePageDto) {
    await this.membership.requireStructureRole(u.id, businessId);
    if (!isValidLayout(dto.layout)) throw new BadRequestException('Layout non valido');
    const page = await this.prisma.page.findUnique({ where: { businessId_slug: { businessId, slug } } });
    if (!page) throw new NotFoundException('Pagina non trovata');
    return this.prisma.page.update({
      where: { id: page.id },
      data: { layout: dto.layout as object[], title: dto.title ?? page.title },
      select: { slug: true, title: true, layout: true },
    });
  }
}
