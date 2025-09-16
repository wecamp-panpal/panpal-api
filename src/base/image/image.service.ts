import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';

export interface ImageUploadOptions {
  folder: string; // e.g., 'recipes', 'users', 'steps'
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default: ['jpg', 'jpeg', 'png', 'webp']
  prefix?: string; // e.g., 'recipe-', 'avatar-'
}

export interface ImageUploadResult {
  url: string;
  filePath: string;
  originalName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class ImageService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Upload image file to Supabase storage
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageUploadOptions,
    userId?: string,
  ): Promise<ImageUploadResult> {
    // Validate file
    this.validateFile(file, options);

    // Generate file path
    const extension = this.getFileExtension(file.mimetype);
    const timestamp = Date.now();
    const userPrefix = userId ? `${userId}-` : '';
    const customPrefix = options.prefix || '';

    const fileName = `${customPrefix}${userPrefix}${timestamp}.${extension}`;
    const filePath = `${options.folder}/${fileName}`;

    // Upload to Supabase
    const url = await this.supabase.uploadPublic(
      filePath,
      file.buffer,
      file.mimetype,
    );

    return {
      url,
      filePath,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions,
    userId?: string,
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadImage(file, options, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete image from storage
   */
  async deleteImage(filePath: string): Promise<void> {
    // Implementation depends on SupabaseService
    // For now, we'll leave this as placeholder
    // You can extend SupabaseService to support delete
    console.log(`Delete image: ${filePath}`);
  }

  /**
   * Validate uploaded file
   */
  private validateFile(
    file: Express.Multer.File,
    options: ImageUploadOptions,
  ): void {
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || ['jpg', 'jpeg', 'png', 'webp'];

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    // Check file type
    const extension = this.getFileExtension(file.mimetype);
    if (!allowedTypes.includes(extension)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check if file is actually an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }
  }

  /**
   * Get file extension from mime type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return mimeToExt[mimeType] || 'jpg';
  }

  /**
   * Generate optimized file name
   */
  generateFileName(
    originalName: string,
    userId?: string,
    prefix?: string,
  ): string {
    const timestamp = Date.now();
    const userPrefix = userId ? `${userId}-` : '';
    const customPrefix = prefix || '';
    const extension = originalName.split('.').pop() || 'jpg';

    return `${customPrefix}${userPrefix}${timestamp}.${extension}`;
  }
}
