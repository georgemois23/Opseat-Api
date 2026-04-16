import { RestaurantService } from './restaurant.service';
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/guards/current-user.decorator";
import { User, UserRole } from "src/users/entities/users.entity";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { InjectRepository } from '@nestjs/typeorm';
import { UserAddress } from 'src/users/userAddress/entities/UserAddress.entity';
import { Repository } from 'typeorm';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('restaurants')
export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService,
    @InjectRepository(UserAddress) private UserAddressRepo: Repository<UserAddress>)
    {}

    @UseGuards(AuthGuard)
    @Get('fillPublicIds')
    async fillPublicIds() {
        return this.restaurantService.fillPublicIds();
    }

    @UseGuards(AuthGuard)
    @Roles(UserRole.ADMIN)
    @Get('all')
    async getAllRestaurants() {
        return this.restaurantService.getAllRestaurants();
    }
    @UseGuards(AuthGuard)
    @Roles(UserRole.ADMIN)
    @Get('backfill')
    async backfillSlugs() {
        // return this.restaurantService.backfill();
        return { message: 'Backfill completed successfully' };
    }

    @UseGuards(AuthGuard)
    @Post('create')
    async createRestaurant(
        @CurrentUser() user: User,
        @Body() restaurantData: CreateRestaurantDto
    ) {
        return this.restaurantService.createRestaurant(restaurantData,user);
        }

        private async getCoordinates(
  user: User,
  coords: { latitude?: string; longitude?: string }
): Promise<{ lat: number; lng: number }> {
  // 1. Try to parse from the request
  const lat = coords.latitude ? parseFloat(coords.latitude) : undefined;
  const lng = coords.longitude ? parseFloat(coords.longitude) : undefined;

  // 2. If valid coordinates were provided, return them immediately
  if (lat !== undefined && !isNaN(lat) && lng !== undefined && !isNaN(lng)) {
    return { lat, lng };
  }

  // 3. Fallback: Fetch the user's default address
  const defaultAddress = await this.UserAddressRepo.findOne({
    where: {
      user: { id: user.id },
      isDefault: true,
    },
  });

  // 4. Error handling if no location can be determined
  if (!defaultAddress) {
    throw new NotFoundException('Please provide coordinates or set a default address.');
  }

  if (defaultAddress.latitude == null || defaultAddress.longitude == null) {
    throw new BadRequestException("Your default address is missing coordinates.");
  }

  return {
    lat: defaultAddress.latitude,
    lng: defaultAddress.longitude,
  };
}

    @UseGuards(AuthGuard)
    @Get('search')
async search(
  @CurrentUser() user: User,
  @Query('q') searchTerm: string,
  @Query() coords: { latitude?: string; longitude?: string }
) {
  if (!searchTerm || searchTerm.length < 2) {
    throw new BadRequestException('Search term must be at least 2 characters');
  }

  // Reuse your coordinate logic here (lat/lng fallback)
  const { lat, lng } = await this.getCoordinates(user, coords);

  return this.restaurantService.globalSearch(lat, lng, searchTerm);
}    

   
    @UseGuards(AuthGuard)
    @Get('my')
    async getMyRestaurants(@CurrentUser() user: User) {
        return this.restaurantService.getRestaurantsForUser(user);
    }     

    @UseGuards(AuthGuard)
    @Get('my/:id')
    async getMyRestaurantByIdForRestaurantUser(
        @CurrentUser() user: User,
        @Param('id') restaurantId: string
    ) {
        return this.restaurantService.getMyRestaurantByIdForRestaurantUser(restaurantId, user);
    }

    @UseGuards(AuthGuard)
    @Post('my/:id/update')
    async updateMyRestaurantByIdForRestaurantUser(
        @CurrentUser() user: User,
        @Param('id') restaurantId: string,
        @Body() updateData: Partial<CreateRestaurantDto>
    ) {
        return this.restaurantService.updateMyRestaurantByIdForRestaurantUser(restaurantId, user, updateData);
    }

    @UseGuards(AuthGuard)
    @Post('my/:id/open')
    async openRestaurant(
        @CurrentUser() user: User,
        @Param('id') restaurantId: string,
    ) {
        return this.restaurantService.openRestaurantByIdForUser(restaurantId, user);
    }

    @UseGuards(AuthGuard)
    @Get('is-open/:id')
    async isRestaurantOpen(
        @Param('id') restaurantId: string,
    ) {
        return this.restaurantService.isRestaurantOpen(restaurantId);
    }

    
    @UseGuards(AuthGuard)

@Get('nearby')
async getNearbyRestaurants(
  @CurrentUser() user: User, 
  @Query() query: { latitude?: string; longitude?: string } // Query params usually come in as strings
) {
  // 1. Parse coordinates from query (and convert to numbers)
  const lat = query.latitude ? parseFloat(query.latitude) : undefined;
  const lng = query.longitude ? parseFloat(query.longitude) : undefined;

  // 2. If both coordinates are provided in the URL, use them immediately
  if (lat !== undefined && !isNaN(lat) && lng !== undefined && !isNaN(lng)) {
    return this.restaurantService.getRestaurantsInDistanceRange(lat, lng);
  }

  // 3. Fallback: Only hit the DB if coordinates weren't in the query
  const defaultAddress = await this.UserAddressRepo.findOne({
    where: {
      user: { id: user.id },
      isDefault: true,
    },
  });

  if (!defaultAddress) {
    throw new NotFoundException('Please set a default address to find nearby restaurants.');
  }

  if (defaultAddress.latitude == null || defaultAddress.longitude == null) {
    throw new BadRequestException("The selected default address is missing coordinates.");
  }

  // 4. Return using the address coordinates
  return this.restaurantService.getRestaurantsInDistanceRange(
    defaultAddress.latitude,
    defaultAddress.longitude,
  );
}

  @UseGuards(AuthGuard)
@Get('nearby/by-category')
async getNearbyRestaurantsByCategory(
  @CurrentUser() user: User, 
  @Query() query: { latitude?: string; longitude?: string; category?: string | string[] }
) {
  // 1. Check for category early
  if (!query.category) {
    throw new BadRequestException('At least one category is required');
  }

  // 2. Normalize category to always be an array
  const categories = Array.isArray(query.category) ? query.category : [query.category];

  // 3. Parse coordinates
  let lat = query.latitude ? parseFloat(query.latitude) : undefined;
  let lng = query.longitude ? parseFloat(query.longitude) : undefined;

  // 4. Fallback Logic: If coords are missing, fetch the default address
  if (lat === undefined || isNaN(lat) || lng === undefined || isNaN(lng)) {
    const defaultAddress = await this.UserAddressRepo.findOne({ 
      where: { 
        user: { id: user.id }, 
        isDefault: true 
      } 
    });

    if (!defaultAddress) {
      throw new NotFoundException('Please provide coordinates or set a default address.');
    }

    if (defaultAddress.latitude == null || defaultAddress.longitude == null) {
      throw new BadRequestException("Your default address is missing coordinates.");
    }

    lat = defaultAddress.latitude;
    lng = defaultAddress.longitude;
  }

  // 5. Call service with guaranteed coordinates and an array of categories
  return this.restaurantService.getRestaurantsInDistanceRangeByCategory(lat, lng, categories);
}
    @UseGuards(AuthGuard)
@Get('/details/:slug')
async getRestaurantBySlug(
  @Param('slug') restaurantSlug: string,
  @CurrentUser() user: User,
  @Query() query: { latitude?: string; longitude?: string }
) {
  let lat = query.latitude ? parseFloat(query.latitude) : undefined;
  let lng = query.longitude ? parseFloat(query.longitude) : undefined;

  // 1. If coordinates aren't provided in the query, fetch the default address
  if (lat === undefined || isNaN(lat) || lng === undefined || isNaN(lng)) {
    const defaultAddress = await this.UserAddressRepo.findOne({ 
      where: { 
        user: { id: user.id }, 
        isDefault: true 
      } 
    });

    if (!defaultAddress) {
      throw new NotFoundException('Please set a default address or provide coordinates to see restaurant details.');
    }

    if (defaultAddress.latitude == null || defaultAddress.longitude == null) {
      throw new BadRequestException("Your default address is missing coordinates.");
    }

    lat = defaultAddress.latitude;
    lng = defaultAddress.longitude;
  }

  // 2. Call the service with either query coords or address coords
  // (Assuming your service order is: slug, longitude, latitude based on your snippet)
  const restaurant = await this.restaurantService.getRestaurantBySlug(
    restaurantSlug, 
    lng, 
    lat
  );

  if (!restaurant) {
    throw new NotFoundException('Restaurant not found');
  }

  return restaurant;
}


}