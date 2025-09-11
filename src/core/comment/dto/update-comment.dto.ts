import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'This is a comment' })
  content?: string;
}
