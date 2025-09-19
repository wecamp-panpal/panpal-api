import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  UnauthorizedException,
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
    
    // Handle specific exception types with better messages
    if (exception instanceof UnauthorizedException) {
      res_content = {
        message: 'Access denied. Please provide a valid authentication token.',
        error: 'Unauthorized',
        statusCode: status,
      };
    } else if (typeof data === 'string') {
      res_content = { 
        message: data,
        error: name,
        statusCode: status,
      };
    } else if (data instanceof Error) {
      res_content = {
        message: data.message,
        error: name,
        statusCode: status,
      };
    } else {
      res_content = {
        ...omit(data, ['statusCode', 'error']),
        error: name,
        statusCode: status,
      };
    }

    // Only add stack trace in development mode and for server errors (5xx)
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const isServerError = status >= 500;
    
    if (isDevelopment && isServerError) {
      assign(res_content, { stack: exception.stack });
    }

    response.status(status).json(res_content);
  }
}
