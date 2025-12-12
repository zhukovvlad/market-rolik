import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @IsString()
  @MinLength(12, { message: 'Пароль должен быть минимум 12 символов' })
  @MaxLength(100, { message: 'Пароль слишком длинный' })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Имя слишком длинное' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Фамилия слишком длинная' })
  lastName?: string;
}
