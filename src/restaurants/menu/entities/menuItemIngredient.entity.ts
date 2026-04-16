import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menuItem.entity";
import { Ingredient } from "./ingredient.entity";

@Entity()
export class MenuItemIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MenuItem, item => item.ingredients)
  menuItem: MenuItem;

  @ManyToOne(() => Ingredient)
  ingredient: Ingredient;
  

  @Column({ nullable: true })
  quantity?: number;

  @Column({ default: true })
  required: boolean;
}