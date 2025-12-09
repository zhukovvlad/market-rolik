import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RegenerateBackgroundDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Scene prompt must not exceed 2000 characters' })
  scenePrompt?: string;
}
