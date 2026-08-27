import { Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
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
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new Error('Email is required');
  }

  return normalized;
}
