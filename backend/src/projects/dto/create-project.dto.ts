import { IsString, IsNotEmpty, Length, IsObject, IsOptional } from 'class-validator';
import { ProjectSettings } from '../interfaces/project-settings.interface';

export class CreateProjectDto {
  // userId удаляем отсюда, он придет из JWT токена

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @IsOptional()
  @IsObject()
  settings?: ProjectSettings;
}
