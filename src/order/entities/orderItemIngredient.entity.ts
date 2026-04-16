import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { OrderItem } from "./orderItem.entity"
import { Ingredient } from "../../restaurants/menu/entities/ingredient.entity";
import { Exclude } from "class-transformer";

@Entity()
export class OrderItemIngredient {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude({ toPlainOnly: true })
  @ManyToOne(() => OrderItem, item => item.ingredients, {onDelete: 'CASCADE',})
  orderItem: OrderItem;

  @ManyToOne(() => Ingredient)
  ingredient: Ingredient;

  // user removed ingredient
  @Column({ default: false })
  removed: boolean;

  // extra ingredient added
  @Column({ default: false })
  extra: boolean;

  // price snapshot
  @Column('decimal', { default: 0 })
  extraPrice: number;
}