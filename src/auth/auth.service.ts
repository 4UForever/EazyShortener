import { Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<User> {
    const email = normalizeEmail(input.email);
    const passwordHash = await this.passwords.hash(input.password);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: UserStatus.PENDING,
      },
    });
  }

  async login(input: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      user.emailVerifiedAt === null ||
      !(await this.passwords.verify(user.passwordHash, input.password))
    ) {
      throw new Error('Invalid email or password');
    }

    return { accessToken: this.jwt.sign({ id: user.id, email: user.email }) };
  }
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new Error('Email is required');
  }

  return normalized;
}
