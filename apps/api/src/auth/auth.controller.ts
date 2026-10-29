import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';
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

const ME = { id: true, email: true, name: true, whatsapp: true, whatsappBusinessId: true } as const;

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

  /** Sempre la stessa risposta: non dice se l'email ha un account. */
  @Post('forgot-password')
  @HttpCode(200)
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: ME });
  }

  /**
   * Scollega il numero WhatsApp (phone vuoto). Il numero non si collega più digitandolo:
   * si collega inviando da WhatsApp il codice di POST /whatsapp/link, così è verificato.
   */
  @Put('me/whatsapp')
  @UseGuards(JwtGuard)
  async setWhatsApp(@CurrentUser() user: AuthUser, @Body() dto: WhatsAppDto) {
    if (normalizePhone(dto.phone)) {
      throw new BadRequestException('Per collegare un numero invia da WhatsApp il codice di "Collega WhatsApp": così siamo sicuri che il telefono è tuo');
    }
    return this.prisma.user.update({ where: { id: user.id }, data: { whatsapp: null, whatsappBusinessId: null }, select: ME });
  }
}
