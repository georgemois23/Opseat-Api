// courier.gateway.ts
import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CourierService } from './courier.service';
import { Injectable } from '@nestjs/common';
// import { CourierLocationDto } from './courier-location.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust this for your security needs
  },
})
export class CourierGateway {

   
    constructor(private readonly courierService: CourierService) {}

  @SubscribeMessage('courier_location_update')
  handleLocationUpdate(
    @MessageBody() data: { latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    // 1. Access the data sent by the client
    const { latitude, longitude} = data;
    
    console.log(`Courier ${client.id} moved to: ${latitude}, ${longitude}`);

    // 2. Do your business logic here (e.g., save to Redis, update DB, broadcast to users)
    // this.courierService.updateLocation(client.id, data);

    // 3. Optional: Send an acknowledgment back to the sender
    return { status: 'success', received: true };
  }

  /** Courier's live GPS while on a delivery — relay it to the customer tracking that order. */
  @SubscribeMessage('delivery_location_update')
  async handleDeliveryLocationUpdate(
    @MessageBody() data: { orderId: string; latitude: number; longitude: number },
  ) {
    const { orderId, latitude, longitude } = data ?? ({} as any);
    if (orderId != null && typeof latitude === 'number' && typeof longitude === 'number') {
      await this.courierService.relayDeliveryLocation(orderId, latitude, longitude);
    }
    return { status: 'success', received: true };
  }

  @SubscribeMessage('finish_delivery')
  handleFinishDelivery(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId } = data;
    console.log(`Courier ${client.id} finished delivery for order ${orderId}`);
    this.courierService.finishDelivery(orderId, client.id); // Assuming you have a service to handle this

    return { status: 'success', orderId };
  }
}