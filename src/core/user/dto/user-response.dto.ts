import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  passwordHash?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
