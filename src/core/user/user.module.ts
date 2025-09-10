import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../common/prisma.service';
import { SupabaseService } from '../../common/supabase.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, SupabaseService],
  exports: [UserService], // Export để Auth module có thể sử dụng
})
export class UserModule {}
