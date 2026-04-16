import { IsEmail, IsOptional, IsString } from "class-validator";
export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
}