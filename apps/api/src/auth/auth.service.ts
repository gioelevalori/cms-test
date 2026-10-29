import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto } from './auth.dto';

const RESET_MINUTES = 30;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** L'email del link: semplice, leggibile anche senza immagini. */
function resetEmailHtml(name: string, link: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#12161b;max-width:480px">
<p>Ciao ${esc(name)},</p>
<p>per scegliere una nuova password premi il pulsante. Il link vale ${RESET_MINUTES} minuti.</p>
<p><a href="${esc(link)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2448d8;color:#fff;text-decoration:none;font-weight:bold">Scegli la nuova password</a></p>
<p style="color:#646d78;font-size:14px">Se non l'hai chiesta tu, ignora questa email: la password resta quella di prima.</p>
</div>`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email già registrata');
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return this.issueToken(user.id, user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenziali non valide');
    }
    return this.issueToken(user.id, user.email, user.name);
  }

  /**
   * "Password dimenticata": se l'email è registrata manda un link valido 30 minuti.
   * La risposta è sempre la stessa, così non si scopre chi ha un account.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) return;
    // Al massimo tre richieste all'ora per account: niente caselle intasate.
    const recent = await this.prisma.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60_000) } } });
    if (recent >= 3) return;

    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      // Vale solo l'ultimo link chiesto.
      this.prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
      this.prisma.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) } }),
    ]);
    const admin = (this.config.get<string>('ADMIN_ORIGIN') ?? 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
    const link = `${admin}/#/reimposta?codice=${token}`;
    const first = user.name.split(' ')[0] || 'ciao';
    await this.mail.send({
      to: user.email,
      subject: 'Nuova password per il tuo sito',
      text: `Ciao ${first},\n\nper scegliere una nuova password apri questo link (vale ${RESET_MINUTES} minuti):\n${link}\n\nSe non l'hai chiesta tu, ignora questa email: la password resta quella di prima.`,
      html: resetEmailHtml(first, link),
    });
  }

  /** Nuova password con il codice del link: il codice vale una volta sola, poi si entra direttamente. */
  async resetPassword(token: string, password: string) {
    const reset = await this.prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new BadRequestException('Il link non vale più: è scaduto o è già stato usato. Chiedine uno nuovo.');
    }
    const used = await this.prisma.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } });
    // Due richieste insieme con lo stesso link: passa solo la prima.
    if (used.count !== 1) throw new BadRequestException('Il link non vale più: è già stato usato. Chiedine uno nuovo.');
    await this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    return this.issueToken(reset.user.id, reset.user.email, reset.user.name);
  }

  private async issueToken(id: string, email: string, name: string) {
    const accessToken = await this.jwt.signAsync({ sub: id, email });
    return { accessToken, user: { id, email, name } };
  }
}
