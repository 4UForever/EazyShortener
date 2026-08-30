import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppKeyService } from '../security/app-key.service';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtGuard } from './jwt.guard';
import { JwtService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordService } from './password.service';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [AuthController],
  providers: [AppKeyService, AuthService, EmailVerificationService, JwtGuard, JwtService, JwtStrategy, PasswordService],
  exports: [AuthService, EmailVerificationService, JwtGuard, JwtService],
})
export class AuthModule {}
