import { UserAddress } from 'src/users/userAddress/entities/UserAddress.entity';
import { Injectable } from "@nestjs/common";
import { User } from "src/users/entities/users.entity";
import { GreekRestaurantCategory, Restaurant } from "./entities/restaurant.entity";
import { Brackets, IsNull, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { RestaurantRole, RestaurantUser } from "src/restaurant-user/entities/restaurantUser.entity";
import { nanoid } from "nanoid";
import { RestaurantSchedule } from "./restaurant-schedule/restaurant-schedule.entity";
import { numericId } from "src/lib/nanoid";
@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
        @InjectRepository(RestaurantUser) private restaurantUserRepo: Repository<RestaurantUser>
        
    ) {}

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

    async isUserLinkedToRestaurant(userId: string, restaurantId: string): Promise<boolean> {
  const count = await this.restaurantUserRepo.count({
    where: {
      user: { id: userId },
      restaurant: { id: restaurantId },
    },
  });
  
  return count > 0;
}

    async fillPublicIds() {
    // Use IsNull() instead of null
    const restaurants = await this.restaurantRepo.find({
      where: { publicId: IsNull() },
    });

    console.log(`Found ${restaurants.length} restaurants without publicId.`);

    for (const restaurant of restaurants) {
      restaurant.publicId = numericId(); // generate 7-digit numeric ID
      restaurant.slug = `${restaurant.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')}-${restaurant.publicId}`;

      await this.restaurantRepo.save(restaurant);
      console.log(
        `Updated restaurant ${restaurant.name}: publicId=${restaurant.publicId}`,
      );
    }

    console.log('✅ All existing restaurants updated with publicId!');
    return restaurants;
  }


    async getAllRestaurants(): Promise<Restaurant[]> {
      return this.restaurantRepo.find();
    }

    async globalSearch(latitude: number, longitude: number, q: string) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);
  const searchTerm = q.toLowerCase();
  const searchPattern = `%${q}%`;

  const matchedCuisines = Object.values(GreekRestaurantCategory)
  .filter((cat) => cat.toLowerCase().includes(searchTerm))
  .sort((a, b) => {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();

    // 1. Priority: Exact matches (unlikely with "an" but good to have)
    if (aLow === searchTerm) return -1;
    if (bLow === searchTerm) return 1;

    // 2. Priority: Starts with (e.g., "An" matches "Asian" before "Sandwich")
    const aStarts = aLow.startsWith(searchTerm);
    const bStarts = bLow.startsWith(searchTerm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // 3. Priority: Position of the match (The "Sandwich" vs "Vegetarian" fix)
    // Lower index (closer to the start) wins
    const aIndex = aLow.indexOf(searchTerm);
    const bIndex = bLow.indexOf(searchTerm);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    // 4. Priority: Length (Shorter matches are usually more relevant)
    return a.length - b.length;
  });

  const restaurants = await this.restaurantRepo
    .createQueryBuilder("restaurant")
    .select([
      "restaurant.id",
      "restaurant.name",
      "restaurant.slug",
      "restaurant.categories",
      "restaurant.imageUrl",
      "restaurant.minimumOrderAmount"
    ])
    .innerJoin("restaurant.schedules", "schedule")
    .where(`
      (
        6371 * acos(
          cos(radians(:lat)) * cos(radians(restaurant.latitude)) *
          cos(radians(restaurant.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(restaurant.latitude))
        )
      ) <= restaurant."deliveryRadius"
    `, { lat: latitude, lng: longitude })
    // --- THE SEARCH LOGIC ---
    .andWhere(new Brackets(qb => {
      qb.where("restaurant.name ILIKE :q", { q: searchPattern })
        .orWhere("restaurant.categories::text ILIKE :q", { q: searchPattern });
    }))
    // ------------------------
    .andWhere('schedule."dayOfWeek" = :currentDay', { currentDay })
    .andWhere('schedule."isClosed" = false')
    .andWhere(`
      CASE 
        WHEN schedule."closeTime" > schedule."openTime" 
        THEN :currentTime::time BETWEEN schedule."openTime"::time AND schedule."closeTime"::time
        ELSE :currentTime::time >= schedule."openTime"::time OR :currentTime::time <= schedule."closeTime"::time
      END
    `, { currentTime })
    .orderBy(`
  CASE 
    WHEN restaurant.name ILIKE :q THEN 1 
    WHEN restaurant.categories::text ILIKE :q THEN 2 
    ELSE 3 
  END
`, "ASC")
    .getMany();

    return {
    cuisines: matchedCuisines,
    restaurants: restaurants,
  };
}

    async backfill() {
        const restaurants = await this.restaurantRepo.find();
        for (const restaurant of restaurants) {
              restaurant.slug = restaurant.name.toLowerCase().trim().replace(/\s+/g, '-') + '-' + restaurant.publicId;
              await this.restaurantRepo.save(restaurant);
        }
         return restaurants;
     }

    async createRestaurant(restaurantData: CreateRestaurantDto, user: User) {
  const { name, schedules, ...otherData } = restaurantData;

  return await this.restaurantRepo.manager.transaction(async (transactionalManager) => {
    console.log('--- STARTING TRANSACTION ---');

    // 1. Create and Save the Restaurant FIRST (with no schedules attached)
    const restaurantEntity = transactionalManager.create(Restaurant, {
      ...otherData,
      name,
    });
    
    // This will generate the ID and the publicId
    const savedRestaurant = await transactionalManager.save(restaurantEntity);
    console.log('1. Restaurant saved. ID:', savedRestaurant.id);

    // 2. Now that we have the ID, save the schedules separately
    if (schedules && schedules.length > 0) {
      const scheduleEntities = schedules.map((s) => {
        return transactionalManager.create(RestaurantSchedule, {
          dayOfWeek: s.dayOfWeek,
          openTime: s.openTime,
          closeTime: s.closeTime,
          isClosed: s.isClosed,
          // Link using ONLY the ID we just got from the database
          restaurant: { id: savedRestaurant.id } as Restaurant,
        });
      });

      // Save the schedules directly to their own table
      await transactionalManager.save(RestaurantSchedule, scheduleEntities);
      console.log('2. Schedules saved separately');
      
      // Attach them to the object in memory just for the return response
      savedRestaurant.schedules = scheduleEntities;
    }

    // 3. Handle the Slug (Now we definitely have the publicId)
    const slug = `${savedRestaurant.name.toLowerCase().trim().replace(/\s+/g, '-')}-${savedRestaurant.publicId}`;
    await transactionalManager.update(Restaurant, savedRestaurant.id, { slug });
    savedRestaurant.slug = slug;
    console.log('3. Slug updated:', slug);

    // 4. Create the Owner link
    const restaurantUser = transactionalManager.create(RestaurantUser, {
      user,
      restaurant: { id: savedRestaurant.id } as Restaurant,
      role: RestaurantRole.OWNER,
    });
    await transactionalManager.save(restaurantUser);
    console.log('4. Owner link saved');

    // 5. Cleanup for response
    if (savedRestaurant.schedules) {
      savedRestaurant.schedules.forEach((s) => delete (s as any).restaurant);
    }

    return savedRestaurant;
  });
}

    async getRestaurantsForUser(user: User): Promise<Restaurant[]> {
        const restaurantUsers = await this.restaurantUserRepo.find({
            where: { user: { id: user.id } },
            relations: ['restaurant',],
        });
        return restaurantUsers.map(ru => ru.restaurant);
    }

    async findByPublicId(publicId: string): Promise<Restaurant | null> {
        return this.restaurantRepo.findOne({ where: { publicId } });
    }

    async findById(id: string): Promise<Restaurant | null> {
        return this.restaurantRepo.findOne({ where: { id } });
    }

    

    async getRestaurantBySlug(
      slug: string, 
      longitude: number, 
      latitude: number
    ): Promise<Restaurant & { outOfRange: boolean } | null> {
      // 1. Fetch the restaurant once (including necessary relations)
      const restaurant = await this.restaurantRepo.findOne({ 
        where: { slug }, 
        relations: ['schedules', 'menus'] 
      });

      if (!restaurant) {
        return null;
      }

      // 2. Calculate the distance in kilometers
      if (restaurant.latitude == null || restaurant.longitude == null) {
        throw new Error('Restaurant coordinates are missing');
      }
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        restaurant.latitude, 
        restaurant.longitude
      );

      // 3. Determine if the user is outside the restaurant's delivery radius
      // Defaulting to 10km if deliveryRadius is not set
      const outOfRange = distance > (restaurant.deliveryRadius || 10);

      // 4. Return the restaurant object with the new field merged in
      const result = Object.assign(restaurant, {
    outOfRange: distance > (restaurant.deliveryRadius || 10)
  });

  return result;
    }

    async isRestaurantOpen(restaurantId: string): Promise<boolean> {
  const restaurant = await this.restaurantRepo.findOne({ 
    where: { id: restaurantId }, 
    relations: ['schedules'] 
  });

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  const now = new Date();
  const currentDay = now.getDay();
  // Ensure this matches your DB format (HH:mm:ss)
  const currentTime = now.toTimeString().slice(0, 8); 

  const todaySchedule = restaurant.schedules.find(s => s.dayOfWeek === currentDay);
  
  if (!todaySchedule || todaySchedule.isClosed) {
    return false;
  }

  const { openTime, closeTime } = todaySchedule;

  // 1. Normal hours (e.g., 09:00 to 22:00)
  if (closeTime > openTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  }

  // 2. Overnight hours (e.g., 18:00 to 02:00)
  // It's open if: it's AFTER opening time OR it's BEFORE closing time (the next morning)
  return currentTime >= openTime || currentTime <= closeTime;
}

    async getMyRestaurantByIdForRestaurantUser(restaurantId: string, user: User): Promise<Restaurant | null> {
        const restaurantUser = await this.restaurantUserRepo.findOne({
            where: {
            user: { id: user.id }, 
            restaurant: { id: restaurantId }, 
          },
            relations: ['restaurant', 'restaurant.schedules'], 
        });
        return restaurantUser ? restaurantUser.restaurant : null;
    }

    async updateMyRestaurantByIdForRestaurantUser(
    restaurantId: string,
    user: User,
    updateData: Partial<CreateRestaurantDto>
  ): Promise<Restaurant | null> {
    
    return await this.restaurantRepo.manager.transaction(async (transactionalManager) => {
      // 1. Verify ownership and fetch existing data with schedules
      const restaurantUser = await transactionalManager.findOne(RestaurantUser, {
        where: {
          user: { id: user.id },
          restaurant: { id: restaurantId },
        },
        relations: ['restaurant', 'restaurant.schedules'],
      });

      if (!restaurantUser) {
        return null;
      }

      const existingRestaurant = restaurantUser.restaurant;

      // 2. Separate schedules from other data to handle them specifically
      const { schedules, ...otherData } = updateData;

      // 3. Merge scalar fields (name, street, deliveryRadius, etc.)
      transactionalManager.merge(Restaurant, existingRestaurant, otherData);

      // 4. Update schedules if provided
      if (schedules) {
        existingRestaurant.schedules = schedules.map((s) => {
          return {
            ...s,
            // We MUST provide the parent reference so TypeORM knows the Foreign Key
            restaurant: existingRestaurant, 
          } as RestaurantSchedule;
        });
      }

      // 5. Save the restaurant
      // With 'orphanRemoval: true' in the Entity, missing schedules will be deleted
      const savedRestaurant = await transactionalManager.save(existingRestaurant);

      // 6. FIX CIRCULAR STRUCTURE: Remove back-references before returning to Controller
      // This prevents the "TypeError: Converting circular structure to JSON"
      if (savedRestaurant.schedules) {
        savedRestaurant.schedules.forEach((s) => {
          delete (s as any).restaurant;
        });
      }

      return savedRestaurant;
    });
  }

    async openRestaurantByIdForUser(restaurantId: string, user: User): Promise<Restaurant | null> {
        const restaurantUser = await this.restaurantUserRepo.findOne({
            where: {
            user: { id: user.id }, 
            restaurant: { id: restaurantId },
          },
            relations: ['restaurant'],
        });
        if (!restaurantUser) {
            return null; 
        }
        restaurantUser.restaurant.isDelivering = !restaurantUser.restaurant.isDelivering;
        await this.restaurantRepo.save(restaurantUser.restaurant);
        return restaurantUser.restaurant;
    }

    async getRestaurantsInDistanceRange(latitude: number, longitude: number) {
  const now = new Date();
  const currentDay = now.getDay(); // Sunday=0, Monday=1... Thursday=4
  const currentTime = now.toTimeString().slice(0, 8); // e.g. "23:22:00"

  return this.restaurantRepo
    .createQueryBuilder("restaurant")
    .select([
      "restaurant.id",
      "restaurant.name",
      "restaurant.slug",
      "restaurant.categories",
      "restaurant.imageUrl",
      "restaurant.minimumOrderAmount",
      "restaurant.isDelivering"
    ])
    .innerJoin("restaurant.schedules", "schedule")
    .where(`
      (
        6371 * acos(
          cos(radians(:lat)) *
          cos(radians(restaurant.latitude)) *
          cos(radians(restaurant.longitude) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians(restaurant.latitude))
        )
      ) <= restaurant."deliveryRadius"
    `, { lat: latitude, lng: longitude })
    .andWhere('schedule."dayOfWeek" = :currentDay', { currentDay })
    .andWhere('schedule."isClosed" = false')
    .andWhere(`
      CASE 
        WHEN schedule."closeTime" > schedule."openTime" 
        THEN :currentTime::time BETWEEN schedule."openTime"::time AND schedule."closeTime"::time
        ELSE :currentTime::time >= schedule."openTime"::time OR :currentTime::time <= schedule."closeTime"::time
      END
    `, { currentTime })
    .getMany();
}

  async getRestaurantsInDistanceRangeByCategory(
  latitude: number, 
  longitude: number, 
  categories: string[]
) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);

  return this.restaurantRepo
    .createQueryBuilder("restaurant")
    .select([
      "restaurant.id",
      "restaurant.name",
      "restaurant.slug",
      "restaurant.categories",
      "restaurant.imageUrl",
      "restaurant.minimumOrderAmount",
      "restaurant.isDelivering"
    ])
    .innerJoin("restaurant.schedules", "schedule")
    // 1. Distance check
    .where(`
      (
        6371 * acos(
          cos(radians(:lat)) *
          cos(radians(restaurant.latitude)) *
          cos(radians(restaurant.longitude) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians(restaurant.latitude))
        )
      ) <= restaurant."deliveryRadius"
    `, { lat: latitude, lng: longitude })
    
    // 2. Array Filter: Check if the restaurant's categories array 
    // overlaps with the user's requested categories array
    .andWhere('restaurant.categories::text[] && :categories::text[]', { 
  categories 
})

    // 3. Schedule checks
    .andWhere('schedule."dayOfWeek" = :currentDay', { currentDay })
    .andWhere('schedule."isClosed" = false')
    .andWhere(`
      CASE 
        WHEN schedule."closeTime" > schedule."openTime" 
        THEN :currentTime::time BETWEEN schedule."openTime"::time AND schedule."closeTime"::time
        ELSE :currentTime::time >= schedule."openTime"::time OR :currentTime::time <= schedule."closeTime"::time
      END
    `, { currentTime })
    .getMany();
}
}