import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@lancex.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMeAdmin123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
