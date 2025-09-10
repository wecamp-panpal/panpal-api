export class CommentResponseDto {
  id: string;
  recipeId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
  };

  constructor(entity: any) {
    this.id = entity.id;
    this.recipeId = entity.recipeId;
    this.userId = entity.userId;
    this.content = entity.content;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    if (entity.user) {
      this.user = {
        id: entity.user.id,
        name: entity.user.name ?? null,
        avatarUrl: entity.user.avatarUrl ?? null,
      };
    }
  }
}

export class CommentListResponseDto {
  items: CommentResponseDto[];
  page: number;
  limit: number;
  total: number;

  constructor(
    items: CommentResponseDto[],
    meta: { page: number; limit: number; total: number },
  ) {
    this.items = items;
    this.page = meta.page;
    this.limit = meta.limit;
    this.total = meta.total;
  }
}
