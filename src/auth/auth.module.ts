import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuthService, PasswordService],
  exports: [AuthService],
})
export class AuthModule {}
