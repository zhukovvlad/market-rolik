import {
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FrontendLogDto {
  @IsIn(['debug', 'info', 'warn', 'error'])
  level: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  context?: string;

  @IsISO8601()
  @IsOptional()
  timestamp?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
