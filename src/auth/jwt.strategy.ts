import { Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(token: string): Promise<User> {
    const claims = this.jwt.verify(token);
    const user = await this.prisma.user.findUnique({ where: { id: claims.sub } });

    if (!user || user.status !== UserStatus.ACTIVE || user.emailVerifiedAt === null) {
      throw new Error('Invalid JWT');
    }

    return user;
  }
}
