import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class ContactMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(3000)
  message: string;
}
