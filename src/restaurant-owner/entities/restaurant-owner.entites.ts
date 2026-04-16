import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RestaurantOwner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  
}