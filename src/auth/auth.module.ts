import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppKeyService } from '../security/app-key.service';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [AuthController],
  providers: [AppKeyService, AuthService, EmailVerificationService, JwtService, PasswordService],
  exports: [AuthService, EmailVerificationService, JwtService],
})
export class AuthModule {}
