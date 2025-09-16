import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { assign, omit } from 'lodash';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { method, originalUrl } = request;

    const name = exception.name;
    const status = exception.getStatus();
    const data = exception.getResponse();

    this.logger.error(
      `${method} ${originalUrl} -> ${name}: ${data['message'] || data}`,
    );

    let res_content: object;
    if (typeof data === 'string') {
      res_content = { message: data };
    } else if (data instanceof Error) {
      res_content = {
        message: data.message,
      };
    } else {
      res_content = omit(data, ['statusCode', 'error']);
    }

    if (this.configService.get<string>('NODE_ENV') === 'development') {
      assign(res_content, { stack: exception.stack });
    }

    response.status(status).json(res_content);
  }
}
