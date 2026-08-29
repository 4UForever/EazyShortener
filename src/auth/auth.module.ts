import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordService } from './password.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuthService, EmailVerificationService, PasswordService],
  exports: [AuthService, EmailVerificationService],
})
export class AuthModule {}
