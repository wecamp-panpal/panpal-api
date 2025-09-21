import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Recipe ID to comment on',
    example: 'recipe-uuid',
  })
  recipeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @ApiProperty({
    description: 'Comment content',
    example:
      'This recipe is amazing! Very easy to follow and delicious results.',
    maxLength: 2000,
  })
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description:
      'Optional rating (1-5 stars). Include this to make it a rating comment.',
    required: false,
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Optional images (max 10)',
    type: [String],
    required: false,
    maxItems: 10,
    example: [
      'https://storage.example.com/comments/result-1.jpg',
      'https://storage.example.com/comments/context-2.jpg',
    ],
  })
  imageUrls?: string[];
}
