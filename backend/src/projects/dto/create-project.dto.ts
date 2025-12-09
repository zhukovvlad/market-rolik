import { IsString, IsNotEmpty, Length, IsOptional, ValidateNested, IsArray, MaxLength, IsIn, IsBoolean, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ASPECT_RATIOS, AspectRatio } from '../constants';

class ProjectSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  usps?: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'mainImage must be a valid URL' })
  @MaxLength(2048)
  mainImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Prompt must not exceed 500 characters' })
  prompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Scene prompt must not exceed 1000 characters' })
  scenePrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  activeSceneAssetId?: string;

  @IsOptional()
  @IsIn(ASPECT_RATIOS)
  aspectRatio?: AspectRatio;

  @IsOptional()
  @IsIn(['energetic', 'calm', 'lofi'])
  musicTheme?: 'energetic' | 'calm' | 'lofi';

  @IsOptional()
  @IsBoolean()
  ttsEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'TTS text must not exceed 500 characters' })
  ttsText?: string;

  @IsOptional()
  @IsIn(['ermil', 'zahar', 'jane', 'alena', 'omazh'])
  ttsVoice?: 'ermil' | 'zahar' | 'jane' | 'alena' | 'omazh';
}

export class CreateProjectDto {
  // userId удаляем отсюда, он придет из JWT токена

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}
