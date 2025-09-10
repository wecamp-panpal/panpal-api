import { UserResponseDto } from '../../../core/user/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
  @ApiProperty({ example: 'token123' })
  accessToken: string;
  @ApiProperty({ example: 'token123', required: false })
  refreshToken?: string;

  constructor(
    user: UserResponseDto,
    accessToken: string,
    refreshToken?: string,
  ) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
