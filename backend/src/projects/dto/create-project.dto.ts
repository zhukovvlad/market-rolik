import { IsString, IsNotEmpty, Length, IsOptional, ValidateNested, IsArray, MaxLength, IsIn } from 'class-validator';
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
  @IsString()
  @MaxLength(2048)
  mainImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;

  @IsOptional()
  @IsString()
  @IsIn(ASPECT_RATIOS)
  aspectRatio?: AspectRatio;
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
