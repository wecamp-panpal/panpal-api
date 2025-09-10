import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './core/user/user.module';
import { AuthModule } from './base/auth/auth.module';
import { RecipeModule } from './core/recipe/recipe.module';
import { CommentModule } from './core/comment/comment.module';
import { FavoriteModule } from './core/favorite/favorite.module';
import { RatingModule } from './core/rating/rating.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    RecipeModule,
    CommentModule,
    FavoriteModule,
    RatingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
