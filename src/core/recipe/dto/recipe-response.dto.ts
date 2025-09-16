export class IngredientDto {
  id: string;
  name: string;
  quantity: string;
}

export class StepDto {
  id: string;
  stepNumber: number;
  instruction: string;
  imageUrl?: string | null;
}

export class RecipeResponseDto {
  id: string;
  title: string;
  description?: string | null;
  cookingTime?: string | null;
  authorName: string;
  authorId: string;
  category: string;
  imageUrl?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  isFavorite?: boolean;
  myRating?: number | null;
  createdAt: Date;
  updatedAt: Date;
  ingredients: IngredientDto[];
  steps: StepDto[];

  constructor(entity: any, currentUserId?: string) {
    this.id = entity.id;
    this.title = entity.title;
    this.description = entity.description ?? null;
    this.cookingTime = entity.cookingTime ?? null;
    this.authorName = entity.authorName;
    this.authorId = entity.authorId;
    this.category = entity.category;
    this.imageUrl = entity.imageUrl ?? null;
    this.ratingAvg = entity.ratingAvg ?? null;
    this.ratingCount = entity.ratingCount ?? null;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.ingredients = (entity.ingredients || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
    }));
    this.steps = (entity.steps || []).map((s: any) => ({
      id: s.id,
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      imageUrl: s.imageUrl,
    }));

    if (currentUserId) {
      if (Array.isArray(entity.favorites)) {
        this.isFavorite = entity.favorites.some(
          (f: any) => f.userId === currentUserId,
        );
      }
      if (Array.isArray(entity.ratings)) {
        const mine = entity.ratings.find(
          (r: any) => r.userId === currentUserId && !r.deletedAt,
        );
        this.myRating = mine ? mine.score : null;
      }
    }
  }
}

export class RecipeListResponseDto {
  items: RecipeResponseDto[];
  page: number;
  limit: number;
  total: number;

  constructor(
    items: RecipeResponseDto[],
    meta: { page: number; limit: number; total: number },
  ) {
    this.items = items;
    this.page = meta.page;
    this.limit = meta.limit;
    this.total = meta.total;
  }
}
