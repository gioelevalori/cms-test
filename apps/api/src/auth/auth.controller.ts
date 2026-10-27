import { Body, ConflictException, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsString, MaxLength } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { JwtGuard } from './jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class WhatsAppDto {
  @IsString() @MaxLength(30) phone: string;
}

/** "+39 333 123 4567", "0039...", "333 1234567" → "393331234567". Vuoto = scollega. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) digits = `39${digits}`; // cellulare italiano senza prefisso
  return digits;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly prisma: PrismaService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, email: true, name: true, whatsapp: true } });
  }

  /** Collega il numero WhatsApp da cui l'utente aggiornerà il sito. */
  @Put('me/whatsapp')
  @UseGuards(JwtGuard)
  async setWhatsApp(@CurrentUser() user: AuthUser, @Body() dto: WhatsAppDto) {
    const whatsapp = normalizePhone(dto.phone);
    if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) throw new BadRequestException('Numero non valido');
    try {
      return await this.prisma.user.update({ where: { id: user.id }, data: { whatsapp }, select: { id: true, email: true, name: true, whatsapp: true } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new ConflictException('Numero già collegato a un altro utente');
      throw err;
    }
  }
}
