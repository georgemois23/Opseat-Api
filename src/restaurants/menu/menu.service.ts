import { CreateMenuItemIngredientDto } from './dto/create-itemIngredient.dto';
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateMenuDto } from "./dto/create-menu.dto";
import { User } from "src/users/entities/users.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "../entities/restaurant.entity";
import { DataSource, In, Repository } from "typeorm";
import { RestaurantUser } from "src/restaurant-user/entities/restaurantUser.entity";
import { Menu } from "./entities/menu.entity";
import { Category } from "./entities/category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { RestaurantService } from "../restaurant.service";
import { Ingredient, IngredientCategory } from "./entities/ingredient.entity";
import { MenuItemIngredient } from './entities/menuItemIngredient.entity';
import { MenuItem } from './entities/menuItem.entity';
import { CreateFullMenuItemDto } from './dto/create-fullMenu.dto';

@Injectable()
export class MenuService {
    constructor(
        @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
        @InjectRepository(RestaurantUser) private restaurantUserRepo: Repository<RestaurantUser>,
        @InjectRepository(Menu) private menuRepo: Repository<Menu>,
        @InjectRepository(Category) private categoryRepo: Repository<Category>,
        @InjectRepository(Ingredient) private ingredientRepo: Repository<Ingredient>,
        @InjectRepository(MenuItemIngredient) private menuItemIngredientRepo: Repository<MenuItemIngredient>,
        @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
        private readonly dataSource: DataSource,
        private readonly restaurantService: RestaurantService,
    ) {}

    async createMenu(restaurantId: string, createMenuDto: CreateMenuDto, user: User) {
        const relation = await this.restaurantUserRepo.findOne({
    where: {
      user: { id: user.id },
      restaurant: { id: restaurantId },
    },
  });

  if (!relation) {
    throw new ForbiddenException('You are not allowed to create a menu for this restaurant');
  }

  // 2️⃣ Get restaurant
  const restaurant = await this.restaurantRepo.findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundException('Restaurant not found');
  }

  // 3️⃣ Create menu
  const menu = this.menuRepo.create({
    ...createMenuDto,
    restaurant,
    active: createMenuDto.active ?? true,
  });

  // 4️⃣ Save
  return this.menuRepo.save(menu);
}

    async getMenuByRestaurant(restaurantId: string) {
  const restaurant = await this.restaurantRepo.findOne({
    where: { id: restaurantId },
    relations: [
      'menus',
      'menus.categories',
      'menus.categories.items',
      'menus.categories.items.ingredients',
      'menus.categories.items.ingredients.ingredient',
    ],
    order: {
      menus: { categories: { order: 'ASC' } },
    },
  });

  if (!restaurant) throw new NotFoundException('Restaurant not found');

  return restaurant.menus.map((menu) => ({
    ...menu,
    categories: menu.categories.map((cat) => {
      // 1. First, calculate 'isSoldOut' for every item
      const processedItems = cat.items.map((item) => {
        const hasMissingRequired = item.ingredients.some(
          (rel) => rel.required && !rel.ingredient.available
        );
        return {
          ...item,
          isSoldOut: !item.available || hasMissingRequired,
        };
      });

      // 2. Then, sort them: isSoldOut: false comes first
      const sortedItems = processedItems.sort((a, b) => 
        Number(a.isSoldOut) - Number(b.isSoldOut)
      );

      return {
        ...cat,
        items: sortedItems,
      };
    }),
  }));
}

    async createCategory(restaurantId: string, menuId: string, createCategoryDto: CreateCategoryDto, user: User) {
        const relation = await this.restaurantUserRepo.findOne({
            where: {
                user: { id: user.id },
                restaurant: { id: restaurantId },
            },
        });
        if (!relation) {
            throw new ForbiddenException('You are not allowed to create a category for this restaurant');
        }
        const menu = await this.menuRepo.findOne({
            where: { id: menuId, restaurant: { id: restaurantId } },
        });
        if (!menu) {
            throw new NotFoundException('Menu not found for this restaurant');
        }
        const category = this.categoryRepo.create({
            ...createCategoryDto,
            menu,
        });
        return this.categoryRepo.save(category);    
    }

    async createIngredient(restaurantId: string, createIngredientDto: CreateIngredientDto, user: User) {
        const relation = await this.restaurantService.isUserLinkedToRestaurant(restaurantId, user.id);
        if (!relation) {
            throw new ForbiddenException('You are not allowed to create an ingredient for this restaurant');
        }
        const restaurant = await this.restaurantRepo.findOne({
            where: { id: restaurantId },
        });
        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }
        const ingredient = this.ingredientRepo.create({
            ...createIngredientDto,
            restaurant,
        });
        return await this.ingredientRepo.save(ingredient);

    }      

    async getIngredientsByRestaurant(restaurantId: string) {
        const restaurant = await this.restaurantRepo.findOne({
            where: { id: restaurantId },
            relations: ['ingredients'],
        });
        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }
        return restaurant.ingredients;
    }

    async toggleIngredient(id: string, available: boolean, user: User) {
    const ingredient = await this.ingredientRepo.findOne({ 
      where: { id },
      relations: ['restaurant'] 
    });
    
    if (!ingredient) throw new NotFoundException();
    
    // Safety check: Does user belong to this restaurant?
    const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, ingredient.restaurant.id);
    if (!isLinked) throw new ForbiddenException();

    ingredient.available = available;
    return await this.ingredientRepo.save(ingredient);
}
    
    async createMenuItemIngredient(
    restaurantId: string, 
    user: User, 
    dto: CreateMenuItemIngredientDto
  ) {
    // 1. Pre-check permissions (outside transaction is fine)
    const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, restaurantId);
    if (!isLinked) throw new ForbiddenException('Unauthorized');

    // 2. Start the Transaction
    return await this.dataSource.transaction(async (manager) => {
      let ingredient;

      // 3. Try to find existing ingredient using the transaction manager
      if (dto.ingredientId) {
        ingredient = await manager.findOne(Ingredient, {
          where: { id: dto.ingredientId, restaurant: { id: restaurantId } },
        });
      }

      // 4. If it doesn't exist, create it inside the transaction
      if (!ingredient && dto.newIngredientName && dto.newIngredientCategory) {
        const newIng = manager.create(Ingredient, {
          name: dto.newIngredientName,
          category: dto.newIngredientCategory,
          restaurant: { id: restaurantId },
        });
        ingredient = await manager.save(newIng);
      }

      if (!ingredient) {
        throw new NotFoundException('Ingredient not found and creation data is missing');
      }

      // 5. Create the link (MenuItemIngredient)
      const link = manager.create(MenuItemIngredient, {
        ingredient: ingredient,
        menuItem: { id: dto.menuItemId },
        quantity: dto.quantity,
        required: dto.required ?? true,
      });

      // 6. Save the final link
      return await manager.save(link);
      
      // If any error happens before this point, 
      // the "newIng" from step 4 is automatically deleted!
    });
  }

  async createFullMenuItem(restaurantId: string, user: User, dto: CreateFullMenuItemDto) {
  // 1. Global Security Check
  const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, restaurantId);
  if (!isLinked) throw new ForbiddenException('Unauthorized');

  // 2. Start Transaction
  return await this.dataSource.transaction(async (manager) => {
    
    // 3. Verify Category belongs to this Restaurant
    const category = await manager.findOne(Category, {
      where: { id: dto.categoryId, menu: { restaurant: { id: restaurantId } } },
      relations: ['menu', 'menu.restaurant'],
    });

    if (!category) {
      throw new NotFoundException('Category not found in this restaurant context');
    }

    // 4. Create the MenuItem
    const menuItem = manager.create(MenuItem, {
      name: dto.name,
      price: dto.price,
      description: dto.description,
      category: category,
      imageUrl: dto.imageUrl ?? '',
    });
    const savedItem = await manager.save(menuItem);

    // 5. Process the Ingredient Recipe
    for (const recipeItem of dto.ingredients) {
      let ingredient;

      // Handle Existing vs New Ingredient
      if (recipeItem.ingredientId) {
        ingredient = await manager.findOne(Ingredient, {
          where: { id: recipeItem.ingredientId, restaurant: { id: restaurantId } },
        });
      } else if (recipeItem.name) {
        ingredient = manager.create(Ingredient, {
          name: recipeItem.name,
          category: recipeItem.category || IngredientCategory.OTHER,
          restaurant: { id: restaurantId },
        });
        ingredient = await manager.save(ingredient);
      }

      if (!ingredient) continue; // Or throw error if you want strict validation

      // 6. Create the MenuItemIngredient Link
      const link = manager.create(MenuItemIngredient, {
        menuItem: savedItem,
        ingredient: ingredient,
        quantity: recipeItem.quantity,
        required: recipeItem.required ?? true,
      });
      await manager.save(link);
    }

    // Return the item with its relations so the frontend can display it immediately
    return await manager.findOne(MenuItem, {
      where: { id: savedItem.id },
      relations: ['ingredients', 'ingredients.ingredient'],
    });
  });
}

    async toggleMenuItemAvailability(menuItemId: string, available: boolean, user: User) {
    // 1. Find the MenuItem with its relations to check ownership
    const menuItem = await this.menuItemRepo.findOne({
      where: { id: menuItemId },
      relations: ['category', 'category.menu', 'category.menu.restaurant'],
    });
    if (!menuItem) throw new NotFoundException('Menu item not found');

    // 2. Check if the user is linked to the restaurant
    const restaurantId = menuItem.category.menu.restaurant.id;
    const isLinked = await this.restaurantService.isUserLinkedToRestaurant(user.id, restaurantId);
    if (!isLinked) throw new ForbiddenException('Unauthorized');

    // 3. Toggle availability
    menuItem.available = available;
    return await this.menuItemRepo.save(menuItem);
     }

}