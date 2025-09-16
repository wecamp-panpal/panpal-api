import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file to upload',
  })
  image: Express.Multer.File;
}

export class MultipleImageUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Multiple image files to upload',
  })
  images: Express.Multer.File[];
}

export class ImageUploadResponseDto {
  @ApiProperty({
    example:
      'https://supabase.co/storage/v1/object/public/images/recipes/1234567890.jpg',
    description: 'Public URL of uploaded image',
  })
  url: string;

  @ApiProperty({
    example: 'recipes/1234567890.jpg',
    description: 'File path in storage',
  })
  filePath: string;

  @ApiProperty({
    example: 'my-recipe-photo.jpg',
    description: 'Original file name',
  })
  originalName: string;

  @ApiProperty({
    example: 1024768,
    description: 'File size in bytes',
  })
  size: number;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the file',
  })
  mimeType: string;
}

export class MultipleImageUploadResponseDto {
  @ApiProperty({
    type: [ImageUploadResponseDto],
    description: 'Array of uploaded image results',
  })
  images: ImageUploadResponseDto[];

  @ApiProperty({
    example: 3,
    description: 'Number of successfully uploaded images',
  })
  count: number;
}
