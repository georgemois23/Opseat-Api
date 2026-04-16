import { IsUUID, IsInt, Min, IsString, IsOptional, IsArray } from 'class-validator';

export class AddItemDto {
  @IsUUID()
  restaurantId: string;

  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  ingredientIds?: string[];

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateItemDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}