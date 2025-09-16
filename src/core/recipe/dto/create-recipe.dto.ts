import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RecipeCategory } from '@prisma/client';


class IngredientInputDto {
  @IsString()
  @ApiProperty({ example: 'Ingredient Name' })
  name: string;

  @IsString()
  @ApiProperty({ example: '100g' })
  quantity: string;
}

class StepInputDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  stepNumber?: number;

  @IsString()
  @ApiProperty({ example: 'Instruction' })
  instruction: string;
}

export class CreateRecipeDto {
  @IsString()
  @ApiProperty({ example: 'Recipe Title' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Recipe Description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '10 minutes' })
  cookingTime?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'John Doe' })
  authorName?: string;

 @IsEnum(RecipeCategory) 
  @ApiProperty({ enum: RecipeCategory, enumName: 'RecipeCategory' })
  category: RecipeCategory;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientInputDto)
  @ApiProperty({ example: [{ name: 'Ingredient Name', quantity: '100g' }] })
  ingredients?: IngredientInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepInputDto)
  @ApiProperty({ example: [{ stepNumber: 1, instruction: 'Instruction' }] })
  steps?: StepInputDto[];
}
