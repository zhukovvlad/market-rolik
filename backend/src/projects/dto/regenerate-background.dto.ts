import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for regenerating background scene with a custom prompt
 */
export class RegenerateBackgroundDto {
  @IsOptional()
  @IsString({ message: 'Scene prompt must be a string' })
  @MinLength(1, { message: 'Scene prompt must not be empty' })
  @MaxLength(2000, { message: 'Scene prompt must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  scenePrompt?: string;
}
