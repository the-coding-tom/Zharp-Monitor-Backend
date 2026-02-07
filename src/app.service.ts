import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse } from './helpers/response.helper';

@Injectable()
export class AppService {
  getHello() {
    return generateSuccessResponse({
      statusCode: HttpStatus.OK,
      message: 'NestJS Backend Template API',
    });
  }

  getHealth() {
    return generateSuccessResponse({
      statusCode: HttpStatus.OK,
      message: 'System is healthy',
      data: {
        name: 'my backend template',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

