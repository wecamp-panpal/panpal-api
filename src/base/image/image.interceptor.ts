import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export interface ImageInterceptorOptions {
  fieldName?: string; // default: 'image'
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default: ['jpg', 'jpeg', 'png', 'webp']
}

/**
 * Factory function to create image upload interceptor
 */
export function ImageUploadInterceptor(options: ImageInterceptorOptions = {}) {
  const {
    fieldName = 'image',
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['jpg', 'jpeg', 'png', 'webp'],
  } = options;

  const multerOptions: MulterOptions = {
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const mimeTypeRegex = new RegExp(`\\/(${allowedTypes.join('|')})$`);
      if (!file.mimetype.match(mimeTypeRegex)) {
        cb(
          new Error(
            `Only image files (${allowedTypes.join(', ')}) are allowed`,
          ),
          false,
        );
      } else {
        cb(null, true);
      }
    },
  };

  return FileInterceptor(fieldName, multerOptions);
}

/**
 * Multiple files upload interceptor
 */
export function MultipleImageUploadInterceptor(
  maxCount: number = 10,
  options: ImageInterceptorOptions = {},
) {
  const {
    fieldName = 'images',
    maxSize = 5 * 1024 * 1024,
    allowedTypes = ['jpg', 'jpeg', 'png', 'webp'],
  } = options;

  const multerOptions: MulterOptions = {
    limits: {
      fileSize: maxSize,
      files: maxCount,
    },
    fileFilter: (req, file, cb) => {
      const mimeTypeRegex = new RegExp(`\\/(${allowedTypes.join('|')})$`);
      if (!file.mimetype.match(mimeTypeRegex)) {
        cb(
          new Error(
            `Only image files (${allowedTypes.join(', ')}) are allowed`,
          ),
          false,
        );
      } else {
        cb(null, true);
      }
    },
  };

  return FilesInterceptor(fieldName, maxCount, multerOptions);
}

/**
 * Recipe-specific interceptor with predefined settings
 */
export const RecipeImageInterceptor = () =>
  ImageUploadInterceptor({
    fieldName: 'image',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
  });

/**
 * Avatar-specific interceptor with smaller size limit
 */
export const AvatarImageInterceptor = () =>
  ImageUploadInterceptor({
    fieldName: 'avatar',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['jpg', 'jpeg', 'png'],
  });

/**
 * Step image interceptor for recipe steps
 */
export const StepImageInterceptor = () =>
  ImageUploadInterceptor({
    fieldName: 'stepImage',
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
  });

export const CommentImageInterceptor = () =>
  MultipleImageUploadInterceptor(10, {
    fieldName: 'commentImage',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
  });
