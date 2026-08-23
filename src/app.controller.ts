import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getServiceInfo(): { name: string; status: string } {
    return {
      name: 'EazyShortener',
      status: 'ok',
    };
  }
}
