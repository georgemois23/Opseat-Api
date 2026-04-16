import { Restaurant } from "../../restaurants/entities/restaurant.entity";
import { User } from "../../users/entities/users.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./orderItem.entity";

export enum OrderStatus {
  DRAFT = 'draft',        // cart
  PENDING = 'pending',    // checkout pressed
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum DeliveryType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

@Entity()
export class Order {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT
  })
  status: OrderStatus;

  @Column('decimal')
  totalPrice: number;

  @ManyToOne(() => User)
  customer: User;

  @ManyToOne(() => Restaurant)
  restaurant: Restaurant;

  @OneToMany(() => OrderItem, (item) => item.order, {
  cascade: true,
  orphanRemoval: true, // <--- THIS IS THE KEY FIX
  onDelete: 'CASCADE',
} as any)
items: OrderItem[];

  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.DELIVERY
  })
  deliveryType: DeliveryType;

  // We store the address as a string or a JSON object for historical accuracy
  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  // Optional: Coordinates are helpful for the countdown logic/map
  @Column({ type: 'float', nullable: true })
  deliveryLat: number;

  @Column({ type: 'float', nullable: true })
  deliveryLng: number;

  @Column({ type: 'text', nullable: true })
  deliveryNotes: string; // e.g., "Gate code is 1234"

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  placedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  estimatedDeliveryTime: Date;
}