import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @IsString()
  @ApiProperty({ example: '123' })
  recipeId: string;

  @IsString()
  @ApiProperty({ example: 'This is a comment' })
  content: string;
}
