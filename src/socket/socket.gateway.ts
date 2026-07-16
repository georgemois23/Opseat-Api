import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie'; // Standard library to parse cookie strings
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL, // Update this to your frontend URL
    credentials: true // MANDATORY for cookies to work
  }
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  @WebSocketServer() server: Server;
  private userSocketMap = new Map<string, string>();

  async handleConnection(client: Socket) {
    try {
      // 1. Get the raw cookie header
      const rawCookie = client.handshake.headers.cookie;
      if (!rawCookie) throw new Error('No cookies found');

      // 2. Parse the cookies
      const parsedCookies = cookie.parse(rawCookie);
      
      // 3. Extract your token (replace 'Authentication' with your cookie name)
      const token = parsedCookies['Authentication'] || parsedCookies['access_token'];

      if (!token) throw new Error('Auth token not found in cookies');

      // 4. Verify the JWT
      const payload = this.jwtService.verify(token);
      
      // 5. Map the User ID to the Socket ID
      this.userSocketMap.set(payload.sub, client.id);
      console.log(`User ${payload.sub} authenticated via cookie.`);
      
    } catch (e: any) {
      console.log('WS Auth Failed:', e.message);
      client.disconnect(); // Reject connection
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected.`);
        break;
      }
    }
  }

  /** Reverse of userSocketMap: find which authenticated user a socket belongs to. */
  private getUserIdBySocket(socketId: string): string | null {
    for (const [userId, sid] of this.userSocketMap.entries()) {
      if (sid === socketId) return userId;
    }
    return null;
  }

  /**
   * Relay a courier's live GPS position (streamed from the courier's delivery page)
   * to the order's customer only. The customer subscribes to `courier_location`.
   */
  @SubscribeMessage('delivery_location_update')
  async handleDeliveryLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { orderId?: string; lat?: number; lng?: number; latitude?: number; longitude?: number },
  ) {
    const orderId = payload?.orderId;
    const lat = payload?.lat ?? payload?.latitude;
    const lng = payload?.lng ?? payload?.longitude;
    if (!orderId || typeof lat !== 'number' || typeof lng !== 'number') return;

    const senderId = this.getUserIdBySocket(client.id);
    if (!senderId) return;

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['customer', 'courier', 'courier.user'],
    });
    if (!order?.customer?.id) return;

    // Only the courier actually assigned to this order may broadcast its location.
    if (!order.courier?.user?.id || order.courier.user.id !== senderId) return;

    this.sendToUser(order.customer.id, 'courier_location', {
      orderId,
      lat,
      lng,
      at: Date.now(),
    });
  }

  // Helper to send to a specific person
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    console.log("EMIT TO USER:", userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Helper to send to a "Room" (e.g., all couriers in a city)
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}