// import { PartialType } from '@nestjs/mapped-types';
// import { CreateUserDto } from './create-user.dto';

import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
