import { CourierService } from './../couriers/courier.service';
import { AddItemDto } from './dto/UpdateItem.dto';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { RestaurantService } from "src/restaurants/restaurant.service";
import { User } from "src/users/entities/users.entity";
import { DataSource, IsNull, Not, Repository } from "typeorm";
import { DeliveryType, Order, OrderStatus } from "./entities/order.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { OrderItemIngredient } from './entities/orderItemIngredient.entity';
import { OrderItem } from './entities/orderItem.entity';
import { UpdateOrderAddressDto } from './dto/SubmitOrder.dto';
import { MenuItem } from 'src/restaurants/menu/entities/menuItem.entity';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class OrderService {
    constructor(
            @InjectRepository(Order) private orderRepo: Repository<Order>,
            @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
            @InjectRepository(MenuItem) private readonly menuItemRepo: Repository<MenuItem>,
            private readonly dataSource: DataSource,
            private readonly restaurantService: RestaurantService,
            private readonly courierService: CourierService,
            private readonly socketGateway: SocketGateway,
        ) {}

    /** Push an event to every user linked to a restaurant (order board sync across devices). */
    private async emitToRestaurantStaff(restaurantId: string, event: string, data: any) {
        if (!restaurantId) return;
        const staffIds = await this.restaurantService.getRestaurantStaffUserIds(restaurantId);
        staffIds.forEach((id) => this.socketGateway.sendToUser(id, event, data));
    }

    /**
     * Notify everyone tracking a status change: the customer, the restaurant staff (live board),
     * and the assigned courier (if any). Expects `restaurant`, `customer`, and — when a courier is
     * assigned — `courier` + `courier.user` relations loaded.
     *
     * When the order reaches a terminal state, the assigned courier is freed for new deliveries.
     */
    private async emitOrderStatusChanged(order: Order) {
        const payload = {
            orderId: order.id,
            status: order.status,
            estimatedDeliveryTime: order.estimatedDeliveryTime ?? null,
        };
        if (order.customer?.id) {
            this.socketGateway.sendToUser(order.customer.id, 'order_status_changed', payload);
        }
        if (order.restaurant?.id) {
            await this.emitToRestaurantStaff(order.restaurant.id, 'order_status_changed', payload);
        }
        if (order.courier?.user?.id) {
            this.socketGateway.sendToUser(order.courier.user.id, 'order_status_changed', payload);
        }

        // Free the courier once the order is done so they can take new deliveries.
        const isTerminal =
            order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED;
        if (isTerminal && order.courier?.id) {
            await this.courierService.releaseCourier(order.courier.id);
        }
    }

    /** Great-circle distance between two lat/lng points, in kilometers (Haversine). */
    private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth radius in km
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

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

    
    async getOrdersForAdmin(userId: string) {
        const orders = await this.orderRepo.find({
            where: { customer: { id: userId }, status: Not(OrderStatus.DRAFT), } ,
            
            relations: ['restaurant', 'items', 'items.menuItem', 'items.ingredients', 'items.ingredients.ingredient']
        });
        if (!orders) throw new NotFoundException('No orders found for this user');
        return orders;
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
            relations: ['items', 'items.menuItem', 'items.ingredients', 'restaurant', 'customer']
        });
        if (!order) throw new Error('Order not found or already submitted');
        order.status = OrderStatus.PENDING;
        order.placedAt = new Date();
        order.deliveryType = addressDto.deliveryType? addressDto.deliveryType : DeliveryType.DELIVERY;
        if (order.deliveryType === DeliveryType.DELIVERY) {
            if (!addressDto.deliveryAddress || !addressDto.deliveryLat || !addressDto.deliveryLng) {
                throw new Error('Delivery address and coordinates are required for delivery orders');
            }

            // Reject delivery addresses that fall outside the restaurant's delivery radius.
            const restLat = Number(order.restaurant?.latitude);
            const restLng = Number(order.restaurant?.longitude);
            const radiusKm = Number(order.restaurant?.deliveryRadius);
            if (
                Number.isFinite(restLat) &&
                Number.isFinite(restLng) &&
                Number.isFinite(radiusKm) &&
                radiusKm > 0
            ) {
                const distanceKm = this.haversineKm(
                    restLat,
                    restLng,
                    Number(addressDto.deliveryLat),
                    Number(addressDto.deliveryLng),
                );
                if (distanceKm > radiusKm) {
                    throw new BadRequestException(
                        `Delivery address is outside this restaurant's delivery area ` +
                            `(${distanceKm.toFixed(1)} km away, limit ${radiusKm} km).`,
                    );
                }
            }

        order.deliveryAddress = addressDto.deliveryAddress;
        order.deliveryLat = addressDto.deliveryLat;
        order.deliveryLng = addressDto.deliveryLng;
        order.deliveryNotes = addressDto.deliveryNotes ? addressDto.deliveryNotes : '';
        }

        const savedOrder = await this.orderRepo.save(order);

        // Checkout complete: push the new order to the restaurant's live board.
        await this.emitToRestaurantStaff(order.restaurant?.id, 'new_order', {
            orderId: savedOrder.id,
            status: savedOrder.status,
            restaurantId: order.restaurant?.id ?? null,
            totalPrice: savedOrder.totalPrice,
            deliveryType: savedOrder.deliveryType,
            placedAt: savedOrder.placedAt,
            itemCount: order.items?.length ?? 0,
        });

        return savedOrder;
    }

    async cancelOrder(orderId: string, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, customer: { id: user.id }, status: OrderStatus.PENDING },
            relations: ['restaurant', 'customer', 'courier', 'courier.user'],
        });
        if (!order) throw new Error('Order not found or cannot be cancelled');
        order.status = OrderStatus.CANCELLED;
        const savedOrder = await this.orderRepo.save(order);
        await this.emitOrderStatusChanged(savedOrder);
        return savedOrder;
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
        const savedOrder = await this.orderRepo.save(order);
        await this.emitOrderStatusChanged(savedOrder);
        return savedOrder;
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

    async markAsReady(orderId: string, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['restaurant', 'customer']
        });
        if (!order) throw new Error('Order not found or cannot be marked as ready');
        const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, order.restaurant.id);
        if (!isLinked) throw new Error('Access denied');


        order.status = OrderStatus.READY;
        const readyOrder = await this.orderRepo.save(order);

        await this.emitOrderStatusChanged(readyOrder);

        const courier = await this.courierService.findCourierForDelivery(readyOrder);

        console.log('Found courier:', courier);

        return readyOrder;
    }

    async updateOrderStatus(orderId: string, status: string, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['restaurant', 'customer', 'courier', 'courier.user']
        });
        if (status === OrderStatus.ACCEPTED) {
            return this.acceptOrder(orderId, user);
        }
        if (status === OrderStatus.READY) {
            return this.markAsReady(orderId, user);
        }
        if (!order) throw new Error('Order not found');
        const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, order.restaurant.id);
        if (!isLinked) throw new Error('Access denied');
        order.status = status as OrderStatus;
        const savedOrder = await this.orderRepo.save(order);
        await this.emitOrderStatusChanged(savedOrder);
        return savedOrder;
    }

}