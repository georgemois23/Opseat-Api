import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';
import { RestaurantService } from '../../restaurants/restaurant.service';

@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(private readonly restaurantService: RestaurantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Look in Params, then Body, then Query string
    const restaurantId = 
      request.params.restaurantId || 
      request.body.restaurantId || 
      request.query.restaurantId;

    if (!user || !restaurantId) {
      throw new ForbiddenException('Restaurant ID could not be identified in the request');
    }

    // Reuse your service method to check the join table
    const isLinked = await this.restaurantService.isUserLinkedToRestaurant(
      user.id, 
      restaurantId
    );

    if (!isLinked) {
      throw new ForbiddenException('Unauthorized: You do not manage this restaurant');
    }

    return true;
  }
}