import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

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

  private async issueToken(id: string, email: string, name: string) {
    const accessToken = await this.jwt.signAsync({ sub: id, email });
    return { accessToken, user: { id, email, name } };
  }
}
