import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Images to upload (max 10 files, 5MB each)',
    maxItems: 10,
  })
  images: Express.Multer.File[];
}

export class UploadImagesResponseDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'URLs of uploaded images',
    example: [
      'https://storage.example.com/comments/comment-abc123.jpg',
      'https://storage.example.com/comments/comment-def456.jpg',
    ],
  })
  imageUrls: string[];
}
