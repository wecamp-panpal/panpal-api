import { DeleteDateProps, GetDataProps, SetDataProps } from './cache';
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Sets data in the cache.
   * @returns boolean indicating success or failure.
   */
  public async setData<T>({
    key,
    value,
    bucket = '0',
    expires_in = 0,
  }: SetDataProps<T>) {
    try {
      await this.cache.set(`${bucket}:${key}`, value, expires_in);
    } catch (error) {
      this.logger.error(`Failed to set cache data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets data from the cache.
   * @param param0 - The cache key and bucket.
   * @returns The cached data or null if not found.
   */

  public async getData<T>({ key, bucket = '0' }: GetDataProps): Promise<T> {
    try {
      const data = await this.cache.get<T>(`${bucket}:${key}`);
      if (!data) {
        throw new NotFoundException('Data not found');
      }
      return data;
      } catch (error) {
      this.logger.error(`Failed to get cache data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes data from the cache.
   * @returns param0 - The cache key and bucket.
   */

  public async deleteData({ key, bucket = '0' }: DeleteDateProps) {
    try {
      await this.cache.del(`${bucket}:${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache data: ${error.message}`);
      throw error;
    }
  }
}
