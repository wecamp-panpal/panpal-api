import { ApiProperty } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 'comment-uuid' })
  id: string;

  @ApiProperty({ description: 'Recipe ID', example: 'recipe-uuid' })
  recipeId: string;

  @ApiProperty({ description: 'User ID', example: 'user-uuid' })
  userId: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'This recipe is fantastic! Easy to follow and delicious results.',
  })
  content: string;

  @ApiProperty({
    description:
      'Optional rating (1-5 stars). Present if this is a rating comment.',
    required: false,
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  rating?: number;

  @ApiProperty({
    description: 'Images attached to comment',
    type: [String],
    example: [
      'https://storage.example.com/comments/result-1.jpg',
      'https://storage.example.com/comments/result-2.jpg',
    ],
  })
  imageUrls: string[];

  @ApiProperty({
    description: 'Number of users who found this helpful',
    example: 8,
  })
  helpfulCount: number;

  @ApiProperty({
    description: 'Whether current user marked this as helpful',
    example: true,
    required: false,
  })
  isMarkedHelpfulByCurrentUser?: boolean;

  @ApiProperty({
    description: 'Comment author information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user-uuid' },
      name: { type: 'string', example: 'John Doe' },
      avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
    },
  })
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };

  @ApiProperty({
    description: 'Comment creation time',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update time',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  // Helper computed properties
  get isRating(): boolean {
    return this.rating !== null && this.rating !== undefined;
  }

  get isComment(): boolean {
    return !this.isRating;
  }

  constructor(entity: any, currentUserId?: string) {
    this.id = entity.id;
    this.recipeId = entity.recipeId;
    this.userId = entity.userId;
    this.content = entity.content;
    this.rating = entity.rating;
    this.imageUrls = entity.imageUrls || [];
    this.helpfulCount = entity.helpfulCount || 0;

    this.user = {
      id: entity.user.id,
      name: entity.user.name || 'Anonymous',
      avatarUrl: entity.user.avatarUrl,
    };

    // Check if current user marked this as helpful
    if (currentUserId && entity.helpfulVotes) {
      this.isMarkedHelpfulByCurrentUser = entity.helpfulVotes.length > 0;
    }

    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}

export class CommentListResponseDto {
  @ApiProperty({
    description: 'List of comments',
    type: [CommentResponseDto],
  })
  items: CommentResponseDto[];

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of comments', example: 45 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Number of rating comments', example: 25 })
  ratingsCount: number;

  @ApiProperty({ description: 'Number of regular comments', example: 20 })
  commentsCount: number;

  constructor(
    items: CommentResponseDto[],
    meta: {
      page: number;
      limit: number;
      total: number;
      ratingsCount: number;
      commentsCount: number;
    },
  ) {
    this.items = items;
    this.page = meta.page;
    this.limit = meta.limit;
    this.total = meta.total;
    this.totalPages = Math.ceil(meta.total / meta.limit);
    this.ratingsCount = meta.ratingsCount;
    this.commentsCount = meta.commentsCount;
  }
}

export class RatingSummaryDto {
  @ApiProperty({
    description: 'Average rating score',
    example: 4.2,
    minimum: 0,
    maximum: 5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Total number of ratings',
    example: 142,
  })
  totalRatings: number;

  @ApiProperty({
    description: 'Rating distribution by star level',
    example: { '5': 85, '4': 32, '3': 15, '2': 7, '1': 3 },
  })
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}
