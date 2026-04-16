import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { MenuItem } from "../../restaurants/menu/entities/menuItem.entity";
import { OrderItemIngredient } from "./orderItemIngredient.entity";
import { Exclude } from "class-transformer";

@Entity()
export class OrderItem {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude({ toPlainOnly: true })
  @ManyToOne(() => Order, (order) => order.items, { 
  nullable: false,   
  onDelete: 'CASCADE' 
})
  order: Order;

  @ManyToOne(() => MenuItem)
  menuItem: MenuItem;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @OneToMany(
  () => OrderItemIngredient,
  ingredient => ingredient.orderItem,
  { cascade: true })
  ingredients: OrderItemIngredient[];

  @Column()
  quantity: number;

  @Column('decimal')
  priceAtOrder: number;  
}