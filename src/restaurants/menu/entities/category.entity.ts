import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Menu } from "./menu.entity";
import { MenuItem } from "./menuItem.entity";
@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Menu, (menu) => menu.categories, { onDelete: 'CASCADE' })
  menu: Menu;

  @Column()
  name: string; // "Burgers", "Drinks"

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => MenuItem, (item) => item.category)
  items: MenuItem[];
}