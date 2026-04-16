import { RestaurantUser } from "../../restaurant-user/entities/restaurantUser.entity";
import { BeforeInsert, Column, Entity, In, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { RestaurantSchedule } from "../restaurant-schedule/restaurant-schedule.entity";
import { Menu } from "../menu/entities/menu.entity";
import { Ingredient } from "../menu/entities/ingredient.entity";
import { numericId } from "../../lib/nanoid";
import { IsOptional, IsUrl } from "class-validator";


export enum GreekRestaurantCategory {
  SOUVLAKI = 'souvlaki',
  GYROS = 'gyros',
  BURGERS = 'burgers',
  PIZZA = 'pizza',
  PASTA = 'pasta',
  SEAFOOD = 'seafood',
  FISH = 'fish',
  MEAT = 'meat',
  KEBAB = 'kebab',
  SALADS = 'salads',
  BREAKFAST = 'breakfast',
  CAFE = 'cafe',
  COFFEE = 'coffee',
  DESSERTS = 'desserts',
  ICE_CREAM = 'ice_cream',
  JUICES = 'juices',
  SMOOTHIES = 'smoothies',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  FAST_FOOD = 'fast_food',
  STREET_FOOD = 'street_food',
  SANDWICHES = 'sandwiches',
  WRAPS = 'wraps',
  PANCAKES = 'pancakes',
  WAFFLES = 'waffles',
  DONUTS = 'donuts',
  PIES = 'pies',
  BAKERY = 'bakery',
  GREEK_TRADITIONAL = 'greek_traditional', // like moussaka, pastitsio
  MEDITERRANEAN = 'mediterranean',
  ASIAN = 'asian', // includes sushi, chinese, thai
  SUSHI = 'sushi',
  CHINESE = 'chinese',
  FAST_DRINKS = 'fast_drinks',
  BEER = 'beer',
  WINE = 'wine',
  COCKTAILS = 'cocktails',
}


@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true,})
  publicId: string; 

  @BeforeInsert()
  generatePublicId() {
    this.publicId = numericId();  
  }

  @Column()
  name: string;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column()
  deliveryRadius: number; // in kilometers

  @OneToMany(() => RestaurantUser, (ru) => ru.restaurant)
  staff: RestaurantUser[];

  @Column({type: 'boolean', default: false})
  isDelivering: boolean;

  @OneToMany(() => RestaurantSchedule, (schedule) => schedule.restaurant, {
  cascade: true, orphanRemoval: true,
} as any)
schedules: RestaurantSchedule[];

  @Column({nullable: true})
  slug: string;

  @Column({
  type: 'enum',
  enum: GreekRestaurantCategory,
  array: true,
  default: [],
  nullable: true,
})
  categories: GreekRestaurantCategory[];

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.restaurant)
  ingredients: Ingredient[];

  @Column({ nullable: true })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrderAmount: number;
}