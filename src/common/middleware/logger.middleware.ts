import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log incoming request
    let bodyMsg = '';
    if (
      body &&
      typeof body === 'object' &&
      Object.keys(body).length > 0 &&
      this.configService.get<string>('NODE_ENV') === 'development'
    ) {
      bodyMsg = `-> BODY: ${JSON.stringify(body)}`;
    }

    this.logger.log(`[${method}] ${originalUrl} - IP: ${ip} ${bodyMsg}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      this.logger.log(
        `[${method}] ${originalUrl} - ${statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
