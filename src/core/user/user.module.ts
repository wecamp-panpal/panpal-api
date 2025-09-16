import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../common/prisma.service';
import { ImageModule } from '../../base/image';

@Module({
  imports: [ImageModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService], // Export để Auth module có thể sử dụng
})
export class UserModule {}
