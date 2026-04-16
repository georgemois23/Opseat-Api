import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Category } from "./category.entity";
import { Restaurant } from "../../../restaurants/entities/restaurant.entity";

@Entity()
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @Column()
  name: string; // "Main Menu", "Lunch Menu"

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Category, (category) => category.menu)
  categories: Category[];
}