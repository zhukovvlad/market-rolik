import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeImageDto {
  @IsString()
  @IsNotEmpty({ message: 'imageUrl is required' })
  imageUrl: string;
}
