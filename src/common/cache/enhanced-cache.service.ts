import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number;
  bucket?: string;
}

@Injectable()
export class EnhancedCacheService {
  private readonly logger = new Logger(EnhancedCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Get data from cache
   */
  async get<T>(key: string, bucket = 'default'): Promise<T | null> {
    try {
      const fullKey = `${bucket}:${key}`;
      const data = await this.cache.get<T>(fullKey);
      if (data) {
        this.logger.debug(`Cache HIT: ${fullKey}`);
      } else {
        this.logger.debug(`Cache MISS: ${fullKey}`);
      }
      return data ?? null;
    } catch (error) {
      this.logger.error(`Cache get failed for ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const { ttl = 300, bucket = 'default' } = options;
      const fullKey = `${bucket}:${key}`;
      await this.cache.set(fullKey, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Cache SET: ${fullKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete from cache
   */
  async del(key: string, bucket = 'default'): Promise<void> {
    try {
      const fullKey = `${bucket}:${key}`;
      await this.cache.del(fullKey);
      this.logger.debug(`Cache DEL: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Cache delete failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    try {
      // Try cache first
      const cached = await this.get<T>(key, options.bucket);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch data
      this.logger.debug(`Fetching data for cache key: ${key}`);
      const data = await fetcher();

      // Store in cache
      await this.set(key, data, options);

      return data;
    } catch (error) {
      this.logger.error(`Cache getOrSet failed for ${key}: ${error.message}`);
      // Fallback to direct fetch
      return await fetcher();
    }
  }

  /**
   * Delete multiple keys by pattern (for cache invalidation)
   */
  async invalidatePattern(pattern: string, bucket = 'default'): Promise<void> {
    try {
      // This is a simplified pattern invalidation
      // In a real Redis implementation, you'd use SCAN
      this.logger.log(
        `Cache invalidation requested for pattern: ${bucket}:${pattern}`,
      );

      // For now, we'll rely on TTL expiration
      // TODO: Implement proper pattern-based deletion with Redis SCAN
    } catch (error) {
      this.logger.error(`Cache pattern invalidation failed: ${error.message}`);
    }
  }
}

// Cache key generators for consistent naming
export class CacheKeys {
  static recipeList(
    category?: string,
    search?: string,
    page = 1,
    limit = 10,
    userId?: string,
  ): string {
    const filters = [category, search, userId].filter(Boolean).join(':');
    return `recipes:list:${filters}:${page}:${limit}`;
  }

  static recipeDetail(recipeId: string, userId?: string): string {
    return `recipe:${recipeId}${userId ? `:user:${userId}` : ''}`;
  }

  static recipeRatings(recipeId: string): string {
    return `recipe:ratings:${recipeId}`;
  }

  static userFavorites(userId: string, page = 1, limit = 10): string {
    return `user:favorites:${userId}:${page}:${limit}`;
  }

  static trendingRecipes(timeframe = '24h'): string {
    return `recipes:trending:${timeframe}`;
  }

  static userPattern(userId: string): string {
    return `*user:${userId}*`;
  }

  static recipePattern(recipeId: string): string {
    return `*recipe:${recipeId}*`;
  }
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  RECIPE_LIST: 300, // 5 minutes
  RECIPE_DETAIL: 900, // 15 minutes
  RECIPE_RATINGS: 600, // 10 minutes
  USER_FAVORITES: 300, // 5 minutes
  TRENDING: 1800, // 30 minutes
  SEARCH_RESULTS: 180, // 3 minutes
} as const;
