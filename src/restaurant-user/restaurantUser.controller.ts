import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Controller, Get, Param, Post } from "@nestjs/common";
import { RestaurantUserService } from './restaurantUser.service';
import { CurrentUser } from 'src/auth/guards/current-user.decorator';
import { User, UserRole } from 'src/users/entities/users.entity';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('restaurant-user')
export class RestaurantUserController {
 constructor(private readonly RestaurantUserService: RestaurantUserService ) {}

    @Roles(UserRole.ADMIN)
    @Get('admin/applications')    
    async getAllApplications() {
        return this.RestaurantUserService.getAllApplications();
    }

    @Roles(UserRole.ADMIN)
    @Post('admin/applications/:applicationId/approve')
    async approveApplication(@Param('applicationId') applicationId: string) {
        return this.RestaurantUserService.approveApplication(applicationId);
    }

    @Roles(UserRole.ADMIN)
    @Post('admin/applications/:applicationId/reject')
    async rejectApplication(@Param('applicationId') applicationId: string) {
        return this.RestaurantUserService.rejectApplication(applicationId);
    }

  @Post('request-partnership')
    async requestPartnership(@CurrentUser() user: User) {
        return this.RestaurantUserService.requestPartnership(user);
    }

   @Get('partnership-status') 
    async getPartnershipStatus(@CurrentUser() user: User) {
        return this.RestaurantUserService.getApplicationStatus(user);
    }


    @Get(':userId')
  async getInfoForRestaurantUser(@Param('userId') userId: string) {
    return this.RestaurantUserService.getInfoForRestaurantUser(userId);
  }
}