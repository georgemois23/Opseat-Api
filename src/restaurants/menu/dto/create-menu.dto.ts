import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateMenuDto {
  @IsString()
  name: string; // e.g. "Main Menu"

  @IsOptional()
  @IsBoolean()
  active?: boolean; // default true
}

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}