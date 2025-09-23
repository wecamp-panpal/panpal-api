import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiProperty({
    description: 'Updated comment content',
    required: false,
    maxLength: 2000,
    example: 'Updated: This recipe is even better than I thought!',
  })
  content?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Updated rating (1-5 stars)',
    required: false,
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Updated images (max 10)',
    type: [String],
    required: false,
    maxItems: 10,
  })
  imageUrls?: string[];
}
