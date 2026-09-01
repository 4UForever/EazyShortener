import { Body, Controller, Get, Header, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { EmailVerificationService } from '../auth/email-verification.service';
import { MailService } from '../mail/mail.service';

interface AuthFormBody {
  email?: unknown;
  password?: unknown;
}

interface AuthViewState {
  email?: string;
  error?: string;
  message?: string;
}

interface CookieResponse {
  cookie(
    name: string,
    value: string,
    options: { httpOnly: boolean; sameSite: 'lax'; secure: boolean; maxAge: number; path: string },
  ): void;
}

@Controller()
export class WebAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly emailVerification: EmailVerificationService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Get('register')
  @Header('Content-Type', 'text/html; charset=utf-8')
  registerPage(): Promise<string> {
    return this.render('register.hbs', {});
  }

  @Post('register')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async register(@Body() body: AuthFormBody): Promise<string> {
    const input = this.readCredentials(body);

    try {
      const user = await this.auth.register(input);
      const { rawToken } = await this.emailVerification.issue(user.id);
      const verificationUrl = new URL('/verify-email', this.config.getOrThrow<string>('APP_BASE_URL'));
      verificationUrl.searchParams.set('token', rawToken);
      await this.mail.sendVerificationEmail(user.email, verificationUrl.toString());

      return this.render('register.hbs', {
        email: user.email,
        message: 'Registration successful. Check your email to verify your account before signing in.',
      });
    } catch (error) {
      return this.render('register.hbs', {
        email: input.email,
        error: error instanceof Error ? error.message : 'Unable to register this account',
      });
    }
  }

  @Get('login')
  @Header('Content-Type', 'text/html; charset=utf-8')
  loginPage(): Promise<string> {
    return this.render('login.hbs', {});
  }

  @Post('login')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async login(@Body() body: AuthFormBody, @Res({ passthrough: true }) response: CookieResponse): Promise<string> {
    const input = this.readCredentials(body);

    try {
      const { accessToken } = await this.auth.login(input);
      const cookieName = this.config.getOrThrow<string>('JWT_COOKIE_NAME');
      const ttlSeconds = this.config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 3_600;
      const nodeEnv = this.config.get<string>('NODE_ENV') ?? 'development';

      response.cookie(cookieName, accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: nodeEnv === 'production',
        maxAge: ttlSeconds * 1000,
        path: '/',
      });

      return this.render('login.hbs', {
        email: input.email,
        message: 'Signed in successfully.',
      });
    } catch (error) {
      return this.render('login.hbs', {
        email: input.email,
        error: error instanceof Error ? error.message : 'Unable to sign in',
      });
    }
  }

  private readCredentials(body: AuthFormBody): { email: string; password: string } {
    return {
      email: typeof body.email === 'string' ? body.email.trim() : '',
      password: typeof body.password === 'string' ? body.password : '',
    };
  }

  private async render(templateName: string, state: AuthViewState): Promise<string> {
    const template = await readFile(join(process.cwd(), 'views', templateName), 'utf8');
    const email = escapeHtml(state.email ?? '');
    const feedback = state.error
      ? `<p class="shortener-error" role="alert">${escapeHtml(state.error)}</p>`
      : state.message
        ? `<p class="auth-success" role="status">${escapeHtml(state.message)}</p>`
        : '';

    return template.replaceAll('{{authEmail}}', email).replace('{{authFeedback}}', feedback);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}
