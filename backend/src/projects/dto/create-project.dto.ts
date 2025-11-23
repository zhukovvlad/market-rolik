import { IsString, IsUUID, IsNotEmpty, Length } from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;
}
