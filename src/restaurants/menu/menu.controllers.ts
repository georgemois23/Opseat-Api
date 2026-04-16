import { AuthGuard } from 'src/auth/guards/auth.guard';
import { MenuService } from './menu.service';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CreateMenuDto } from './dto/create-menu.dto';
import { CurrentUser } from 'src/auth/guards/current-user.decorator';
import { User } from 'src/users/entities/users.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { CreateMenuItemIngredientDto } from './dto/create-itemIngredient.dto';
import { CreateFullMenuItemDto } from './dto/create-fullMenu.dto';


@Controller('menu')
export class MenuController {
    constructor(private readonly MenuService: MenuService) {}

    @UseGuards(AuthGuard)
    @Post(':restaurantId/create')
    async createMenu(
        @Param('restaurantId') restaurantId: string,
        @Body() createMenuDto: CreateMenuDto,
        @CurrentUser() user: User
    ) {
        return this.MenuService.createMenu(restaurantId, createMenuDto, user);
    }

    @Get(':restaurantId')
    async getMenuByRestaurant(@Param('restaurantId') restaurantId: string) {
        return this.MenuService.getMenuByRestaurant(restaurantId);
    }

    @UseGuards(AuthGuard)
    @Post(':restaurantId/:menu/create/category')
    async createCategory(
        @Param('restaurantId') restaurantId: string,
        @Param('menu') menuId: string,
        @Body() createCategoryDto: CreateCategoryDto,
        @CurrentUser() user: User
    ) {
        return this.MenuService.createCategory(restaurantId, menuId, createCategoryDto, user);
    }

    @UseGuards(AuthGuard)
    @Post(':restaurantId/:menu/create/ingredient')
    async createIngredient(
        @Param('restaurantId') restaurantId: string,
        @Param('menu') menuId: string,
        @Body() createIngredientDto: CreateIngredientDto,
        @CurrentUser() user: User
    ) {
        return this.MenuService.createIngredient(restaurantId, createIngredientDto, user);
    }

    @UseGuards(AuthGuard)
    @Get(':restaurantId/ingredients')
    async getIngredientsByRestaurant(@Param('restaurantId') restaurantId: string) {
        return this.MenuService.getIngredientsByRestaurant(restaurantId);
    }

    @UseGuards(AuthGuard)
    @Patch('ingredients/:id/toggle')
    async toggleIngredient(
        @Param('id') id: string,
        @Body('available') available: boolean,
        @CurrentUser() user: User
    ) {
        return this.MenuService.toggleIngredient(id, available, user);
    }

    @UseGuards(AuthGuard)
    @Post(':restaurantId/:menu/create/menu-item')
    async createMenuItem(
        @Param('restaurantId') restaurantId: string,
        @Body() createMenuItemDto: CreateMenuItemIngredientDto,
        @CurrentUser() user: User
    ) {
        return this.MenuService.createMenuItemIngredient(restaurantId, user, createMenuItemDto);
    }

    @UseGuards(AuthGuard)
    @Post(':restaurantId/create/full-menu-item')
    async createFullMenuItem(
        @Param('restaurantId') restaurantId: string,
        @Body() createFullMenuItemDto: CreateFullMenuItemDto,
        @CurrentUser() user: User
    ) {
        return this.MenuService.createFullMenuItem(restaurantId, user, createFullMenuItemDto);
    }

    @UseGuards(AuthGuard)
    @Patch('items/:id/toggle')
    async toggleMenuItem(
        @Param('id') id: string,
        @Body('available') available: boolean,
        @CurrentUser() user: User
    ) {
        return this.MenuService.toggleMenuItemAvailability(id, available, user);
    }

}
