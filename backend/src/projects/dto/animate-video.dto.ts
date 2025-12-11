import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for animating video with a custom prompt
 */
export class AnimateVideoDto {
  @IsOptional()
  @IsString({ message: 'Animation prompt must be a string' })
  @MinLength(1, { message: 'Animation prompt must not be empty' })
  @MaxLength(500, { message: 'Animation prompt must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  prompt?: string;
}
