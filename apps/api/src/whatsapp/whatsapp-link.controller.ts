import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { randomInt } from 'node:crypto';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppClient } from './whatsapp.client';

class LinkDto {
  @IsString() @MaxLength(40) businessId: string;
}

/** Lettere e cifre che non si confondono tra loro (niente 0/O, 1/I/L, 5/S, 2/Z, 8/B). */
const ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';
const CODE_LENGTH = 6;
const VALID_MINUTES = 15;

export const LINK_MESSAGE = 'COLLEGA';

function newCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

/**
 * Collegamento del numero WhatsApp senza digitarlo: l'admin genera un codice,
 * il titolare lo invia dal suo telefono al numero dell'assistente, e il numero da cui arriva
 * viene collegato. Così si collega solo un numero di cui si ha davvero il telefono.
 */
@Controller('whatsapp/link')
@UseGuards(JwtGuard)
export class WhatsAppLinkController {
  constructor(private readonly prisma: PrismaService, private readonly client: WhatsAppClient) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: LinkDto) {
    const membership = await this.prisma.membership.findUnique({ where: { userId_businessId: { userId: user.id, businessId: dto.businessId } } });
    if (!membership) throw new ForbiddenException('Non fai parte di questa attività');

    const code = newCode();
    const expiresAt = new Date(Date.now() + VALID_MINUTES * 60_000);
    // Un solo codice valido per utente: generarne uno nuovo invalida i precedenti.
    await this.prisma.$transaction([
      this.prisma.whatsAppLink.deleteMany({ where: { userId: user.id } }),
      this.prisma.whatsAppLink.create({ data: { code, userId: user.id, businessId: dto.businessId, expiresAt } }),
    ]);

    const number = await this.client.displayNumber();
    const message = `${LINK_MESSAGE} ${code}`;
    return {
      code,
      message,
      expiresAt,
      number,
      link: number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null,
    };
  }
}
