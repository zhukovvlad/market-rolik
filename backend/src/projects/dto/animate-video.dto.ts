import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AnimateVideoDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Animation prompt must not exceed 500 characters' })
  prompt?: string;
}
