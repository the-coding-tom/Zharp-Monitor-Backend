import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

/**
 * Root routes: hello and health check for load balancers and monitoring.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Root hello message. */
  @Get()
  getHello(@Res() response: Response) {
    const { status, ...restOfResponse } = this.appService.getHello();
    response.status(status).json(restOfResponse);
  }

  /** Health check for load balancers and monitoring. */
  @Get('health')
  getHealth(@Res() response: Response) {
    const { status, ...restOfResponse } = this.appService.getHealth();
    response.status(status).json(restOfResponse);
  }
}

