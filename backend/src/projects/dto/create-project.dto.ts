import { IsString, IsNotEmpty, Length, IsObject, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectSettings } from '../interfaces/project-settings.interface';

class ProjectSettingsDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usps?: string[];

  @IsOptional()
  @IsString()
  mainImage?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;
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
