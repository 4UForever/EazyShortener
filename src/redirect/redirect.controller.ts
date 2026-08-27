import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { RedirectService } from './redirect.service';

@Controller()
export class RedirectController {
  constructor(private readonly redirects: RedirectService) {}

  @Get(':shortCode')
  @Redirect(undefined, 302)
  async redirect(@Param('shortCode') shortCode: string): Promise<{ url: string }> {
    const url = await this.redirects.resolve(shortCode);
    return { url };
  }
}
