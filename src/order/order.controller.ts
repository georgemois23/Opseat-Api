import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CurrentUser } from "src/auth/guards/current-user.decorator";
import { User } from "src/users/entities/users.entity";
import { UpdateOrderDto } from "./dto/UpdateOrder.dto";
import { AddItemDto, UpdateItemDto } from "./dto/UpdateItem.dto";
import { UpdateOrderAddressDto } from "./dto/SubmitOrder.dto";

@Controller('order')
export class OrderController {
 constructor(private readonly OrderService: OrderService) {}


 @Get('my')
    async getMyOrders(@CurrentUser() user: User) {  
        return this.OrderService.getMyOrders(user);
    }
 @Post('create/:restaurantId')
 async createOrder(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: User
 ) {
        return this.OrderService.createOrder(restaurantId, user);
 }

 @Get('current') // This matches /order/current
async checkExistingOrder(
    @Query('restaurantId') restaurantId: string, // Changed @Param to @Query
    @CurrentUser() user: User
) {
    return this.OrderService.checkExistingOrder(restaurantId, user);
}

    @Post(':orderId/submit')
    async submitOrder(
        @Param('orderId') orderId: string,
        @Body() addressDto: UpdateOrderAddressDto,
        @CurrentUser() user: User
    ) {
        return this.OrderService.submitOrder(orderId, user, addressDto);
    }

    @Put('/:orderId/items')
    async updateOrder(
        @Param('orderId') orderId: string,
        @Body() updateOrderDto: UpdateOrderDto,
        @CurrentUser() user: User
    ) {
        return this.OrderService.updateOrder(orderId, updateOrderDto, user);
    }
    @Post('item')
  async addItem(
    @Body() addItemDto: AddItemDto,
    @CurrentUser() user: User
  ) {
    return this.OrderService.addItem(
      addItemDto,
      user,
    );
  }



  // 3. Update a specific row in the cart
  @Patch('item/:id')
  async updateItem(
    @Param('id') orderItemId: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: User
  ) {
    return this.OrderService.updateItem(
      orderItemId,
      updateItemDto.quantity || 1,
      updateItemDto.comment || '',
      user
    );
  }

  // 4. Remove a specific row from the cart
  @Delete('item/:id')
  async removeItem(
    @Param('id') orderItemId: string,
    @CurrentUser() user: User
  ) {
    return this.OrderService.removeItem(orderItemId, user);
  }

  @Get('restaurant/:restaurantId')
    async getOrdersByRestaurant(
        @Param('restaurantId') restaurantId: string,
        @CurrentUser() user: User
    ) {
        return this.OrderService.getOrdersByRestaurant(restaurantId, user);
    }

    @Patch(':orderId/status')
    async updateOrderStatus(
        @Param('orderId') orderId: string,
        @Body('status') status: string,
        @CurrentUser() user: User
    ) {
        return this.OrderService.updateOrderStatus(orderId, status, user);
    }

    @Patch(':orderId/cancel')
    async cancelOrder(
        @Param('orderId') orderId: string,
        @CurrentUser() user: User
    ) {
        return this.OrderService.cancelOrder(orderId, user);
    }
}