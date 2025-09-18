import { Global, Logger, Module } from '@nestjs/common';
import { CacheModule as _CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    _CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger(_CacheModule.name);
        return {
          stores: [
            createKeyv({
              url: configService.get<string>('REDIS_URL'),
              password: configService.get<string>('REDIS_PASSWORD'),
              socket: {
                reconnectStrategy: (retries: number) => {
                  if (retries > 3) {
                    return false;
                  }
                  logger.error(`Retrying redis connection (${retries})`);
                  return 3000;
                },
              },
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
