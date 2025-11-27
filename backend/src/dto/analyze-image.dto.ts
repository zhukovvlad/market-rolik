import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class AnalyzeImageDto {
  @IsString()
  @IsNotEmpty({ message: 'imageUrl is required' })
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl: string;
}
