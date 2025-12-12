import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  MaxLength,
  MinLength,
  IsIn,
  IsBoolean,
  IsUrl,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ASPECT_RATIOS,
  AspectRatio,
  MUSIC_THEMES,
  MusicTheme,
  TTS_VOICES,
  TtsVoice,
} from '../constants';

/**
 * DTO for project settings configuration
 * Validates all fields used in project creation and updates
 */
export class ProjectSettingsDto {
  @IsOptional()
  @IsString({ message: 'Product name must be a string' })
  @MinLength(1, { message: 'Product name must not be empty' })
  @MaxLength(100, { message: 'Product name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  productName?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(1, { message: 'Description must not be empty' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsArray({ message: 'USPs must be an array' })
  @ArrayMinSize(1, {
    message: 'At least one USP is required if USPs are provided',
  })
  @ArrayMaxSize(10, { message: 'Maximum 10 USPs allowed' })
  @Transform(({ value }) =>
    value?.map((item: string) =>
      typeof item === 'string' ? item.trim() : item,
    ),
  )
  @IsString({ each: true, message: 'Each USP must be a string' })
  @MinLength(1, { each: true, message: 'Each USP must not be empty' })
  @MaxLength(200, {
    each: true,
    message: 'Each USP must not exceed 200 characters',
  })
  usps?: string[];

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    {
      message:
        'Main image must be a valid URL with protocol (http:// or https://)',
    },
  )
  @MaxLength(2048, {
    message: 'Main image URL must not exceed 2048 characters',
  })
  mainImage?: string;

  @IsOptional()
  @IsString({ message: 'Animation prompt must be a string' })
  @MinLength(1, { message: 'Animation prompt must not be empty' })
  @MaxLength(500, {
    message: 'Animation prompt must not exceed 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  prompt?: string;

  @IsOptional()
  @IsString({ message: 'Scene prompt must be a string' })
  @MinLength(1, { message: 'Scene prompt must not be empty' })
  @MaxLength(1000, { message: 'Scene prompt must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  scenePrompt?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Active scene asset ID must be a valid UUID v4' })
  activeSceneAssetId?: string;

  @IsOptional()
  @IsIn(ASPECT_RATIOS, {
    message: `Aspect ratio must be one of: ${ASPECT_RATIOS.join(', ')}`,
  })
  aspectRatio?: AspectRatio;

  @IsOptional()
  @IsIn(MUSIC_THEMES, {
    message: `Music theme must be one of: ${MUSIC_THEMES.join(', ')}`,
  })
  musicTheme?: MusicTheme;

  @IsOptional()
  @IsBoolean({ message: 'TTS enabled must be a boolean value' })
  ttsEnabled?: boolean;

  @IsOptional()
  @IsString({ message: 'TTS text must be a string' })
  @MinLength(1, { message: 'TTS text must not be empty' })
  @MaxLength(500, { message: 'TTS text must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  ttsText?: string;

  @IsOptional()
  @IsIn(TTS_VOICES, {
    message: `TTS voice must be one of: ${TTS_VOICES.join(', ')}`,
  })
  ttsVoice?: TtsVoice;
}

/**
 * DTO for creating a new project
 * Enforces validation for all required and optional fields
 */
export class CreateProjectDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @ValidateNested({
    message: 'Settings must be a valid ProjectSettingsDto object',
  })
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}
