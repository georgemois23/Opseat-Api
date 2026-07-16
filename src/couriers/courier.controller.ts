import { CreateCourierDto } from './dto/courier.dto';
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "src/auth/guards/current-user.decorator";
import { User, UserRole } from "src/users/entities/users.entity";
import { CourierService } from "./courier.service";
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('couriers')
export class CourierController {
    constructor(private readonly CourierService: CourierService ) {}

    @Post('request-partnership')
        async requestPartnership(@CurrentUser() user: User, @Body() createCourierDto: CreateCourierDto) {
            return this.CourierService.requestPartnership(user, createCourierDto);
        }
    
       @Get('partnership-status') 
        async getPartnershipStatus(@CurrentUser() user: User) {
            return this.CourierService.getApplicationStatus(user);
        }

        @Roles(UserRole.ADMIN)
            @Get('admin/applications')    
            async getAllApplications() {
                return this.CourierService.getAllApplications();
            }
        
            @Roles(UserRole.ADMIN)
            @Post('admin/applications/:applicationId/approve')
            async approveApplication(@Param('applicationId') applicationId: string) {
                return this.CourierService.approveApplication(applicationId);
            }
        
            @Roles(UserRole.ADMIN)
            @Post('admin/applications/:applicationId/reject')
            async rejectApplication(@Param('applicationId') applicationId: string) {
                return this.CourierService.rejectApplication(applicationId);
            }

            @Post('location')
            async updateLocation(
                @CurrentUser() user: User,
                @Body() locationDto: { latitude: number; longitude: number }
            ) {
                return this.CourierService.updateLocation(user, locationDto);
            }

            @Post('/delivery/:orderId/accept')
            async acceptOrder(
                @CurrentUser() user: User,
                @Param('orderId') orderId: string
            ) {
                console.log(`Courier ${user.id} accepted order ${orderId}`);
                return this.CourierService.acceptOrder(orderId, user);
            }

            @Post('/delivery/:orderId/pickup')
            async orderPickedUpByCourier(
                @CurrentUser() user: User,
                @Param('orderId') orderId: string
            ) {
                console.log(`Courier ${user.id} picked up order ${orderId}`);
                return this.CourierService.orderPickedUpByCourier(orderId, user);
            }

            @Get('/delivery/:orderId/status')
            async getOrderStatus(
                @CurrentUser() user: User,
                @Param('orderId') orderId: string
            ) {
                return this.CourierService.getOrderStatus(orderId, user);
            }

            @Get('active-delivery')
            async getActiveDelivery(@CurrentUser() user: User) {
                return this.CourierService.getActiveDelivery(user);
            }

            @Get('history')
            async getRideHistory(@CurrentUser() user: User) {
                return this.CourierService.getRideHistory(user);
            }

            @Get('/delivery/:orderId')
            async getDeliveryDetails(
                @CurrentUser() user: User,
                @Param('orderId') orderId: string
            ) {
                return this.CourierService.getDeliveryDetails(orderId, user);
            }

}