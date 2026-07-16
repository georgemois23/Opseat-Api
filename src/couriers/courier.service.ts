import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Courier } from "./entities/courier.entity";
import { In, Not, Repository } from "typeorm";
import { User } from "src/users/entities/users.entity";
import { CreateCourierDto } from "./dto/courier.dto";
import { ApplicationStatus } from "../common/enums/application-status.enum";
import { Order, OrderStatus } from "src/order/entities/order.entity";
import { SocketGateway } from "src/socket/socket.gateway";
import { RestaurantUser } from "src/restaurant-user/entities/restaurantUser.entity";

@Injectable()
export class CourierService {
    constructor(
                @InjectRepository(Courier) private courierRepo: Repository<Courier>,
                private socketGateway: SocketGateway,
    
    
    
        ) {}

     async requestPartnership(user: User, createCourierDto: CreateCourierDto) {
            const existing = await this.courierRepo.findOne({
                where: { user: { id: user.id } }
            });

            if (existing) {
                throw new Error('Application already exists');
            }
            console.log('Creating courier application for user:', user.id, 'with data:', createCourierDto);
            const courierUser = this.courierRepo.create({
                ...createCourierDto, // Correct spread syntax
                user: user,          // Now TypeORM will see the JoinColumn and save userId
                applicationStatus: ApplicationStatus.PENDING,
            });
            return this.courierRepo.save(courierUser);
        }
    
        async getApplicationStatus(user: User) {
            const courierUser = await this.courierRepo.findOne({
                where: { user: { id: user.id } },
            });
            if (!courierUser) {
                return { status: 'no_application' };
            }
            return { status: courierUser.applicationStatus };
        }

        async getAllApplications() {
        return this.courierRepo.find({
            where: { applicationStatus: ApplicationStatus.PENDING },
            // relations: ['user', 'restaurant']
        });
    }

    async approveApplication(applicationId: string) {
        const courierUser = await this.courierRepo.findOne({
            where: { id: applicationId },
            // relations: ['user', 'restaurant']
        });

        if (!courierUser) {
            throw new Error('Application not found');
        }

        courierUser.applicationStatus = ApplicationStatus.APPROVED;
        return this.courierRepo.update(applicationId,courierUser);
    }

    async rejectApplication(applicationId: string) {
        const courierUser = await this.courierRepo.findOne({
            where: { id: applicationId },
            // relations: ['user', 'restaurant']
        });
        if (!courierUser) {
            throw new Error('Application not found');
        }
        courierUser.applicationStatus = ApplicationStatus.REJECTED;
        return this.courierRepo.update(applicationId,courierUser);
    }

    async findCourierForDelivery(order: Order): Promise<Courier | null> {
    const radius = 5; // Radius in Kilometers
    
    // Ensure these values exist before running the query
    const restaurantLat = order.restaurant.latitude;
    const restaurantLng = order.restaurant.longitude;

    // FIX: Wrapped column names in double quotes and added the "courier" alias
    const distanceSql = `
        (6371 * acos(
            cos(radians(:lat)) * cos(radians("courier"."currentLat")) * cos(radians("courier"."currentLng") - radians(:lng)) + 
            sin(radians(:lat)) * sin(radians("courier"."currentLat"))
        ))
    `;

    const closestCourier = await this.courierRepo.createQueryBuilder('courier')
        .leftJoinAndSelect('courier.user', 'user')
        .addSelect(distanceSql, 'distance')
        .where('courier.isAvailable = :available', { available: true })
        .andWhere('courier.isOnline = :online', { online: true })
        .andWhere('courier.applicationStatus = :status', { status: ApplicationStatus.APPROVED })
        // Use the formula again in the WHERE/HAVING clause
        .andWhere(`${distanceSql} < :radius`, { radius }) 
        .setParameter('lat', restaurantLat)
        .setParameter('lng', restaurantLng)
        .orderBy('distance', 'ASC')
        .getOne();

        if (closestCourier) {
            await this.notifyCourierOfNewDelivery(closestCourier.user.id, order);
        }
    return closestCourier || null;
}

    async notifyCourierOfNewDelivery(courierUserId: string, orderData: any) {
    this.socketGateway.sendToUser(courierUserId, 'new_order_available', orderData);
  }

    async updateLocation(user: User, locationDto: { latitude: number; longitude: number }) {
        const courier = await this.courierRepo.findOne({
            where: { user: { id: user.id } },
        });
        if (!courier) {
            throw new Error('Courier profile not found');
        }
        courier.currentLat = locationDto.latitude;
        courier.currentLng = locationDto.longitude;
        courier.isOnline = true;  
        return this.courierRepo.save(courier);
    }

    async orderPickedUpByCourier(orderId: string, user: User) {
    const courier = await this.courierRepo.findOne({
        where: { user: { id: user.id } },
    });

    if (!courier) {
        throw new Error('Courier profile not found');
    }

    const order = await this.courierRepo.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['customer', 'restaurant', 'items', 'courier']
    });

    if (!order) {
        throw new Error('Order not found');
    }

    order.courier = courier;
    order.status = OrderStatus.ON_THE_WAY;

    // ✅ FIX: Save the ORDER, not the courier
    await this.courierRepo.manager.save(order);

    // Notify the customer that the order is on the way
    this.socketGateway.sendToUser(order.customer.id, 'order_on_the_way', { orderId: order.id });
    const statusPayload = {
        orderId: order.id,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime ?? null,
    };
    this.socketGateway.sendToUser(order.customer.id, 'order_status_changed', statusPayload);
    // Keep the restaurant's live board in sync with the courier's action.
    await this.notifyRestaurantStaff(order.restaurant?.id, 'order_status_changed', statusPayload);
    }

    /** Push a websocket event to every user linked to a restaurant (live order board). */
    private async notifyRestaurantStaff(restaurantId: string | undefined, event: string, data: any) {
        if (!restaurantId) return;
        const links = await this.courierRepo.manager.find(RestaurantUser, {
            where: { restaurant: { id: restaurantId } },
            relations: ['user'],
        });
        links.forEach((link) => {
            if (link.user?.id) this.socketGateway.sendToUser(link.user.id, event, data);
        });
    }

    /** Relay a courier's live GPS ping to the customer tracking this order. */
    async relayDeliveryLocation(orderId: string, latitude: number, longitude: number) {
        if (!orderId) return;
        const order = await this.courierRepo.manager.findOne(Order, {
            where: { id: orderId },
            relations: ['customer'],
        });
        if (!order?.customer?.id) return;
        this.socketGateway.sendToUser(order.customer.id, 'courier_location', {
            orderId,
            latitude,
            longitude,
        });
    }

    async getOrderStatus(orderId: string, user: User) {
    const courier = await this.courierRepo.findOne({
        where: { user: { id: user.id } },
    });
    if (!courier) {
        throw new Error('Courier profile not found');
    }
    const order = await this.courierRepo.manager.findOne(Order, {
        where: { id: orderId, courier: { id: courier.id } },
        relations: ['customer', 'restaurant', 'items', 'courier']
    });
    return order ? { status: order.status } : { status: 'not_found' };
    }

    /** The courier's current in-flight delivery (assigned, not yet delivered/cancelled), or null. */
    async getActiveDelivery(user: User) {
        const courier = await this.courierRepo.findOne({
            where: { user: { id: user.id } },
        });
        if (!courier) return null;
        const order = await this.courierRepo.manager.findOne(Order, {
            where: {
                courier: { id: courier.id },
                status: Not(In([OrderStatus.DELIVERED, OrderStatus.CANCELLED])),
            },
            relations: ['customer', 'restaurant', 'items', 'items.menuItem', 'courier'],
            order: { createdAt: 'DESC' },
        });
        return order ?? null;
    }

    /** Full order for a specific delivery assigned to this courier (any status), for the live page. */
    async getDeliveryDetails(orderId: string, user: User) {
        const courier = await this.courierRepo.findOne({
            where: { user: { id: user.id } },
        });
        if (!courier) throw new Error('Courier profile not found');
        const order = await this.courierRepo.manager.findOne(Order, {
            where: { id: orderId, courier: { id: courier.id } },
            relations: ['customer', 'restaurant', 'items', 'items.menuItem', 'courier'],
        });
        return order ?? null;
    }

    /** Mark a courier available again (e.g. after their order reached a terminal state). */
    async releaseCourier(courierId: string) {
        if (!courierId) return;
        await this.courierRepo.update(courierId, { isAvailable: true });
    }

    /** Past rides for this courier — completed and cancelled deliveries, newest first. */
    async getRideHistory(user: User) {
        const courier = await this.courierRepo.findOne({
            where: { user: { id: user.id } },
        });
        if (!courier) return [];
        return this.courierRepo.manager.find(Order, {
            where: {
                courier: { id: courier.id },
                status: In([OrderStatus.DELIVERED, OrderStatus.CANCELLED]),
            },
            relations: ['restaurant', 'items', 'customer'],
            order: { createdAt: 'DESC' },
        });
    }

    async acceptOrder(orderId: string, user: User) {
        const courier = await this.courierRepo.findOne({
            where: { user: { id: user.id } },
            relations: ['user'],
        });
        if (!courier) {
            throw new Error('Courier profile not found');
        }

        const order = await this.courierRepo.manager.findOne(Order, {
            where: { id: orderId },
            relations: ['customer', 'restaurant', 'courier'],
        });
        if (!order) {
            throw new Error('Order not found');
        }

        // Prevent double-assignment: another courier already grabbed it.
        if (order.courier && order.courier.id !== courier.id) {
            throw new Error('Order already assigned to another courier');
        }

        order.courier = courier;
        order.status = OrderStatus.ON_THE_WAY;
        courier.isAvailable = false;

        // Recalculate the delivery ETA now that we know which courier is coming
        // and where they currently are.
        const etaMinutes = this.estimateDeliveryMinutes(courier, order);
        order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);

        await this.courierRepo.manager.save(courier);
        const savedOrder = await this.courierRepo.manager.save(order);

        // Notify the customer that a courier is assigned, with the new ETA.
        this.socketGateway.sendToUser(order.customer.id, 'courier_assigned', {
            orderId: savedOrder.id,
            status: savedOrder.status,
            estimatedDeliveryTime: savedOrder.estimatedDeliveryTime,
            etaMinutes,
            courier: {
                id: courier.id,
                firstName: courier.user?.first_name ?? null,
                lastName: courier.user?.last_name ?? null,
                vehicleType: courier.vehicleType,
            },
        });
        const statusPayload = {
            orderId: savedOrder.id,
            status: savedOrder.status,
            estimatedDeliveryTime: savedOrder.estimatedDeliveryTime ?? null,
        };
        this.socketGateway.sendToUser(order.customer.id, 'order_status_changed', statusPayload);
        // Keep the restaurant's live board in sync with the courier's action.
        await this.notifyRestaurantStaff(order.restaurant?.id, 'order_status_changed', statusPayload);

        return {
            orderId: savedOrder.id,
            status: savedOrder.status,
            estimatedDeliveryTime: savedOrder.estimatedDeliveryTime,
            etaMinutes,
        };
    }

    /**
     * Estimate delivery time in minutes: courier -> restaurant -> customer,
     * using straight-line (haversine) distance divided by an average speed,
     * plus a small buffer for pickup handling.
     */
    private estimateDeliveryMinutes(courier: Courier, order: Order): number {
        const AVG_SPEED_KMH = 25; // rough urban courier speed
        const PICKUP_BUFFER_MIN = 5;
        const DEFAULT_MIN = 30; // fallback when coordinates are missing

        const coords = [
            courier.currentLat,
            courier.currentLng,
            order.restaurant?.latitude,
            order.restaurant?.longitude,
            order.deliveryLat,
            order.deliveryLng,
        ];

        if (!coords.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) {
            return DEFAULT_MIN;
        }

        const [courierLat, courierLng, restLat, restLng, custLat, custLng] = coords;

        const toRestaurantKm = this.haversineKm(courierLat, courierLng, restLat, restLng);
        const toCustomerKm = this.haversineKm(restLat, restLng, custLat, custLng);
        const totalKm = toRestaurantKm + toCustomerKm;

        const travelMinutes = (totalKm / AVG_SPEED_KMH) * 60;
        return Math.max(1, Math.round(travelMinutes + PICKUP_BUFFER_MIN));
    }

    private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth radius in km
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async finishDelivery(orderId: string, courierSocketId: string) {
        const order = await this.courierRepo.manager.findOne(Order, {
            where: { id: orderId },
            relations: ['customer', 'restaurant', 'courier'],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        order.status = OrderStatus.DELIVERED;
        await this.courierRepo.manager.save(order);
        if (order.courier) {
            order.courier.isAvailable = true;
            await this.courierRepo.manager.save(order.courier);
        }

        const statusPayload = {
            orderId: order.id,
            status: order.status,
            estimatedDeliveryTime: order.estimatedDeliveryTime ?? null,
        };
        if (order.customer?.id) {
            this.socketGateway.sendToUser(order.customer.id, 'order_status_changed', statusPayload);
        }
        await this.notifyRestaurantStaff(order.restaurant?.id, 'order_status_changed', statusPayload);
    }

}