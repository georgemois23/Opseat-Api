import { Restaurant } from "../../../restaurants/entities/restaurant.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
export enum IngredientCategory {
  SAUCE = 'sauce',
  MEAT = 'meat',
  CHEESE = 'cheese',
  VEGETABLE = 'vegetable',
  BREAD = 'bread',
  DRINK_BASE = 'drink_base',
  COFFEE = 'coffee',
  SPICE = 'spice',
  OTHER = 'other',
}

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;  

  @Column({
    type: 'enum',
    enum: IngredientCategory,
    default: IngredientCategory.OTHER,
  })
  category: IngredientCategory;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => Restaurant, r => r.ingredients)
  restaurant: Restaurant;
}