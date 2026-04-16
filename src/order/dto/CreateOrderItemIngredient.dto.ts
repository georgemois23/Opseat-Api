import { IsUUID, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateOrderItemIngredientDto {
  @IsUUID()
  ingredientId: string;

  @IsBoolean()
  @IsOptional()
  removed?: boolean = false;

  @IsBoolean()
  @IsOptional()
  extra?: boolean = false;

  // Usually, price is handled by the backend to prevent tampering, 
  // but included here if your logic requires client-side price passing.
  @IsNumber()
  @IsOptional()
  @Min(0)
  extraPrice?: number;
}