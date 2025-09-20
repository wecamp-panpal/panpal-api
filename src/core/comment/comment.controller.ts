import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
} from './dto/comment-response.dto';
import { JwtAuthGuard } from '../../base/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('comments')
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 200, description: 'Create a new comment' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Request() req,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List comments by recipe' })
  @ApiQuery({ name: 'recipeId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List comments by recipe' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async findAll(
    @Query('recipeId') recipeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CommentListResponseDto> {
    return this.commentService.findAll(recipeId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Update a comment' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Delete a comment' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.commentService.remove(id, req.user.id);
  }
}
