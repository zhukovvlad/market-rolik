import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class AnalyzeImageDto {
  @IsString()
  @IsNotEmpty({ message: 'imageUrl is required' })
  imageUrl: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  uspCount?: number;
}
