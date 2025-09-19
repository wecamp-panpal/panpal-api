import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  role?: string | null;
  created_at: Date;
  updated_at: Date;

  @Exclude()
  passwordHash?: string;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.avatarUrl = user.avatarUrl;
    this.country = user.country;
    this.role = user.role;
    this.created_at = user.createdAt;
    this.updated_at = user.updatedAt;
  }
}
