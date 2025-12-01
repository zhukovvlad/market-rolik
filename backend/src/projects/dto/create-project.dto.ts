import { IsString, IsNotEmpty, Length, IsObject, IsOptional } from 'class-validator';

export class CreateProjectDto {
  // userId удаляем отсюда, он придет из JWT токена

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
