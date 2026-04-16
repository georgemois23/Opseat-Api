import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserAddressService } from "./userAddress.service";
import { CurrentUser } from "../../auth/guards/current-user.decorator";
import { User } from "../entities/users.entity";
import { CreateUserAddressDto } from "./dto/create-user-address.dto";
import { AuthGuard } from "src/auth/guards/auth.guard";

@Controller('user-address')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @UseGuards(AuthGuard)
  @Post('add')
  async addUserAddress(
    @CurrentUser() user: User,
    @Body() addressData: CreateUserAddressDto
  ) {
    return this.userAddressService.addUserAddress(user, addressData);
  }

  @UseGuards(AuthGuard)
  @Patch('update/:addressId')
    async updateUserAddress(  
    @CurrentUser() user: User,
    @Param('addressId') addressId: string,
    @Body() addressData: CreateUserAddressDto
  ) {
    // Implement update logic in the service
    return this.userAddressService.updateUserAddress(user, addressId, addressData);
  }

  @UseGuards(AuthGuard)
  @Patch('delete/:addressId')
  async deleteUserAddress(
    @CurrentUser() user: User,
    @Param('addressId') addressId: string
  ) {
    // Implement delete logic in the service (soft delete or actual delete)
    return this.userAddressService.deleteUserAddress(user, addressId);
  }


  @UseGuards(AuthGuard)
  @Get('my-addresses')
  async getMyAddresses(@CurrentUser() user: User) {
    return this.userAddressService.getUserAddresses(user);
  }

  @UseGuards(AuthGuard)
  @Post('set-default/:addressId')
  async setDefaultAddress(
    @CurrentUser() user: User,
    @Param('addressId') addressId: string
  ) {
    return this.userAddressService.setDefaultAddress(user, addressId);
  }
}