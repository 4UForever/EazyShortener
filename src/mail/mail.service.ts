import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { verificationEmailTemplate } from './templates';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.getOrThrow<string>('SMTP_USER');
    const password = this.config.getOrThrow<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: user ? { user, pass: password } : undefined,
    });
    this.from = this.config.getOrThrow<string>('MAIL_FROM');
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const template = verificationEmailTemplate(verificationUrl);

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }
}
