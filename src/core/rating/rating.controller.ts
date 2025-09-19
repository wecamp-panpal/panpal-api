import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import { RatingService } from './rating.service';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

class UpsertRatingDto {
  recipeId: string;
  score: number; // 1..5
  imageUrls?: string[]; // User review images
  comment?: string; // User review comment
}

@Controller('ratings')
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upsert my rating for a recipe' })
  async upsert(@Request() req, @Body() dto: UpsertRatingDto) {
    return this.ratingService.upsert(
      req.user.id,
      dto.recipeId,
      dto.score,
      dto.imageUrls,
      dto.comment,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List ratings of a recipe' })
  @ApiQuery({ name: 'recipeId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @Query('recipeId') recipeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ratingService.list(recipeId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete my rating for a recipe' })
  @ApiQuery({ name: 'recipeId', required: true })
  async remove(@Request() req, @Query('recipeId') recipeId: string) {
    return this.ratingService.remove(req.user.id, recipeId);
  }
}
