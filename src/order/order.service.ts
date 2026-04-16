import { AddItemDto } from './dto/UpdateItem.dto';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { Injectable, NotFoundException } from "@nestjs/common";
import { RestaurantService } from "src/restaurants/restaurant.service";
import { User } from "src/users/entities/users.entity";
import { DataSource, IsNull, Repository } from "typeorm";
import { DeliveryType, Order, OrderStatus } from "./entities/order.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { OrderItemIngredient } from './entities/orderItemIngredient.entity';
import { OrderItem } from './entities/orderItem.entity';
import { UpdateOrderAddressDto } from './dto/SubmitOrder.dto';
import { MenuItem } from 'src/restaurants/menu/entities/menuItem.entity';

@Injectable()
export class OrderService {
    constructor(
            @InjectRepository(Order) private orderRepo: Repository<Order>,
            @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
            @InjectRepository(MenuItem) private readonly menuItemRepo: Repository<MenuItem>,
            private readonly dataSource: DataSource,
            private readonly restaurantService: RestaurantService,
        ) {}

    private async recalculateOrderTotal(orderId: string) {
    const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items']
    });
    if (!order) throw new Error('Order not found');

    const total = order.items.reduce((sum, item) => {
        return sum + (Number(item.priceAtOrder) * item.quantity);
    }, 0);

    order.totalPrice = Math.round(total * 100) / 100;
    return this.orderRepo.save(order);
}

    async getMyOrders(user: User) { 
        return this.orderRepo.find({
            where: { customer: { id: user.id } },
            relations: ['restaurant', 'items', 'items.menuItem', 'items.ingredients', 'items.ingredients.ingredient']
        });
    }
    async createOrder(restaurantId: string, user: User) {
        const restaurant = await this.restaurantService.findById(restaurantId);
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }
        const existingOrder = await this.orderRepo.findOne({
            where: {
                restaurant: { id: restaurantId },
                customer: { id: user.id },
                status: OrderStatus.DRAFT,
            },
        });
        if (existingOrder) {
            return existingOrder;
        }
        const newOrder = this.orderRepo.create({
            restaurant,
            customer: user,
            totalPrice: 0,
            status: OrderStatus.DRAFT,

        });
        return this.orderRepo.save(newOrder);
    }

    async checkExistingOrder(restaurantId: string, user: User): Promise<Order | null> {
    const order = await this.orderRepo.findOne({
        where: {
            restaurant: { id: restaurantId },
            customer: { id: user.id },
            status: OrderStatus.DRAFT,
        },
        // Load the items, the menu item details, and the ingredients
        relations: [
            'items', 
            'items.menuItem', 
            'items.ingredients', 
            'items.ingredients.ingredient'
        ],
    });

    if (!order) {
        this.createOrder(restaurantId, user); // Create a new order if none exists  
        return null;
    }

    // Break the circular references to prevent the JSON crash
    // Using (item as any) to bypass the TypeScript 'delete' restriction
    order.items?.forEach((item) => {
        delete (item as any).order;
        item.ingredients?.forEach((ing) => delete (ing as any).orderItem);
    });

    return order;
}

    async submitOrder(orderId: string, user: User, addressDto: UpdateOrderAddressDto, ) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, customer: { id: user.id }, status: OrderStatus.DRAFT },
            relations: ['items', 'items.menuItem', 'items.ingredients']
        });
        if (!order) throw new Error('Order not found or already submitted');
        order.status = OrderStatus.PENDING;
        order.placedAt = new Date();
        order.deliveryType = addressDto.deliveryType? addressDto.deliveryType : DeliveryType.DELIVERY;
        if (order.deliveryType === DeliveryType.DELIVERY) {
            if (!addressDto.deliveryAddress || !addressDto.deliveryLat || !addressDto.deliveryLng) {
                throw new Error('Delivery address and coordinates are required for delivery orders');
            }
        order.deliveryAddress = addressDto.deliveryAddress;
        order.deliveryLat = addressDto.deliveryLat;
        order.deliveryLng = addressDto.deliveryLng;
        order.deliveryNotes = addressDto.deliveryNotes ? addressDto.deliveryNotes : '';
        }

        return this.orderRepo.save(order);
    }

    async cancelOrder(orderId: string, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, customer: { id: user.id }, status: OrderStatus.PENDING },
        });
        if (!order) throw new Error('Order not found or cannot be cancelled');
        order.status = OrderStatus.CANCELLED;
        return this.orderRepo.save(order);
    }

    async acceptOrder(orderId: string, user: User) {

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['restaurant', 'customer']
        });
        if (!order) throw new Error('Order not found or cannot be accepted');
        const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, order.restaurant.id);
        if (!isLinked) throw new Error('Access denied');
        order.status = OrderStatus.ACCEPTED;
        order.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // Example: set to 30 minutes from now
        return this.orderRepo.save(order);
    }

   async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto, user: User) {
    // 1. Fetch order with items and ingredients
    const order = await this.orderRepo.findOne({
        where: {
            id: orderId,
            customer: { id: user.id },
            status: OrderStatus.DRAFT,
        },
        relations: [
            'items', 
            'items.menuItem', // <--- ADD THIS LINE
            'items.ingredients'
        ] 
    });

    if (!order) {
        throw new Error('Order not found or is no longer pending');
    }

    // 2. Process incoming items from DTO
    // We create a new array to hold the "final state" of the order items
    const updatedItems: OrderItem[] = [];

    for (const itemDto of updateOrderDto.items) {
        // Find if this menu item already exists in the current order
        let orderItem = order.items.find(
            (existing) => existing.menuItem?.id === itemDto.menuItemId
        );

        if (orderItem) {
            // --- UPDATE EXISTING ITEM ---
            orderItem.quantity = itemDto.quantity;
            orderItem.priceAtOrder = itemDto.unitPrice;
            orderItem.comment = itemDto.comment;
        } else {
            // --- CREATE NEW ITEM ---
            orderItem = new OrderItem();
            orderItem.order = order;
            orderItem.menuItem = { id: itemDto.menuItemId } as any;
            orderItem.quantity = itemDto.quantity;
            orderItem.priceAtOrder = itemDto.unitPrice;
            orderItem.comment = itemDto.comment;
        }

        // 3. Update Ingredients for this item
        // We replace the ingredients with the new selection provided by the frontend
        orderItem.ingredients = itemDto.ingredientIds.map(ingId => {
            const orderIngredient = new OrderItemIngredient();
            orderIngredient.ingredient = { id: ingId } as any;
            orderIngredient.orderItem = orderItem; 
            return orderIngredient;
        });

        updatedItems.push(orderItem);
    }

    // 4. Update the order object with the new list of items
    // Because 'orphanRemoval: true' is set in the Entity, any items 
    // that were in order.items but NOT in updatedItems will be DELETED.
    order.items = updatedItems;

    // 5. Calculate total price
    const rawTotal = order.items.reduce(
        (total, item) => total + (Number(item.priceAtOrder) * item.quantity), 
        0
    );
    order.totalPrice = Math.round(rawTotal * 100) / 100;

    // 6. Save (The cascade and orphanRemoval will handle the DB cleanup)
    const savedOrder = await this.orderRepo.save(order);

    // 7. BREAK THE CIRCLE (Stop the crash)
    savedOrder.items.forEach(item => {
        delete (item as any).order; 
        if (item.ingredients) {
            item.ingredients.forEach(ing => delete (ing as any).orderItem);
        }
    });

    return savedOrder;
}

 async addItem(addItemDto: AddItemDto, user: User) {
  const { restaurantId, menuItemId, quantity, ingredientIds, comment } = addItemDto;

  // 1. Fetch MenuItem
    const menuProduct = await this.menuItemRepo.findOne({ where: { id: menuItemId } });
  if (!menuProduct) throw new NotFoundException('Menu item not found');

  // 2. Get or Create the PENDING order
  let order = await this.createOrder(restaurantId, user);

  // 3. Find if an identical item exists
  // We check for: Same MenuItem ID AND Same Ingredients AND Same Comment
  const existingItems = await this.orderItemRepo.find({
    where: { 
      order: { id: order.id }, 
      menuItem: { id: menuItemId },
      comment: comment ?? IsNull() // Only match if comments are the same
    },
    relations: ['ingredients', 'ingredients.ingredient']
  });

  const normalizedIncomingIngs = [...(ingredientIds ?? [])].sort();

  const existingItem = existingItems.find(item => {
    const itemIngIds = item.ingredients.map(i => i.ingredient.id).sort();
    return JSON.stringify(itemIngIds) === JSON.stringify(normalizedIncomingIngs);
  });

  if (existingItem) {
    // Match found! Increment quantity.
    existingItem.quantity += quantity;
    await this.orderItemRepo.save(existingItem);
  } else {
    // No match found. Create a new row with the comment.
    const newItem = this.orderItemRepo.create({
      order,
      menuItem: { id: menuItemId },
      quantity,
      comment, // <--- SAVING THE COMMENT HERE
      priceAtOrder: menuProduct.price, 
      ingredients: (ingredientIds ?? []).map(id => ({
        ingredient: { id }
      }))
    });
    await this.orderItemRepo.save(newItem);
  }

  return this.recalculateOrderTotal(order.id);
}
async updateItem(orderItemId: string, quantity: number, comment: string, user: User) {
    const item = await this.orderItemRepo.findOne({
        where: { id: orderItemId, order: { customer: { id: user.id }, status: OrderStatus.DRAFT } },
        relations: ['order']
    });

    if (!item) throw new Error('Item not found');

    item.quantity = quantity;
    item.comment = comment;
    await this.orderItemRepo.save(item);

    return this.recalculateOrderTotal(item.order.id);
}
async removeItem(orderItemId: string, user: User) {
    const item = await this.orderItemRepo.findOne({
        where: { id: orderItemId, order: { customer: { id: user.id }, status: OrderStatus.DRAFT } },
        relations: ['order']
    });

    if (!item) throw new Error('Item not found');
    
    const orderId = item.order.id;
    await this.orderItemRepo.remove(item);

    return this.recalculateOrderTotal(orderId);
}

    async getOrdersByRestaurant(restaurantId: string, user: User) {
        const restaurant = await this.restaurantService.findById(restaurantId);
        const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, restaurantId);
        if (!isLinked) throw new Error('Access denied');
        if (!restaurant) throw new Error('Restaurant not found');
        return this.orderRepo.find({
            where: { restaurant: { id: restaurantId } },
            relations: ['customer', 'items', 'items.menuItem', 'items.ingredients', 'items.ingredients.ingredient']
        });
    }

    async updateOrderStatus(orderId: string, status: string, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['restaurant', 'customer']
        });
        if (status === OrderStatus.ACCEPTED) {
            return this.acceptOrder(orderId, user);
        }
        if (!order) throw new Error('Order not found');
        const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, order.restaurant.id);
        if (!isLinked) throw new Error('Access denied');
        order.status = status as OrderStatus;
        return this.orderRepo.save(order);
    }

}