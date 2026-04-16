import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Category } from "./category.entity";
import { MenuItemIngredient } from "./menuItemIngredient.entity";

@Entity()
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category, (category) => category.items, { onDelete: 'CASCADE' })
  category: Category;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  available: boolean;

  @OneToMany(
    () => MenuItemIngredient,
    mi => mi.menuItem
  )
  ingredients: MenuItemIngredient[];
}