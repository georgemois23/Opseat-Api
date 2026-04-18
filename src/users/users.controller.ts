import { Controller, Get, Post, Body, Param, NotFoundException, UseGuards, Delete, Patch } from '@nestjs/common';
import { PassportLocalGuard } from 'src/auth/guards/passport-local.guard';
import { User, UserRole } from './entities/users.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @Get('admin')
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
async updateUser(
  @Param('id') id: string,
  @Body() updateData: Partial<User>
) {
  return this.usersService.updateUser(id, updateData);
}



@UseGuards(AuthGuard)
@Get('data/:id')
async getUserData(@Param('id') id: string) {
  return this.usersService.getUserById(id);
}
}
