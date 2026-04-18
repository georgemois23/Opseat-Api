import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationStatus, RestaurantRole, RestaurantUser } from './entities/restaurantUser.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class RestaurantUserService {
    constructor(
            @InjectRepository(RestaurantUser) private restaurantUserRepo: Repository<RestaurantUser>,



    ) {}

    async getInfoForRestaurantUser(userId: string) {
        return this.restaurantUserRepo.find({
            where: { user: { id: userId } },
            relations: ['restaurant']
        });
    }

    async requestPartnership(user: User) {
        const restaurantUser = this.restaurantUserRepo.create({
            user: user,
            role: RestaurantRole.OWNER,
            applicationStatus: ApplicationStatus.PENDING
        });
        return this.restaurantUserRepo.save(restaurantUser);
    }

    async getApplicationStatus(user: User) {
        const restaurantUser = await this.restaurantUserRepo.findOne({
            where: { user: { id: user.id } },
            relations: ['restaurant']
        });
        if (!restaurantUser) {
            return { status: 'no_application' };
        }
        return { status: restaurantUser.applicationStatus, restaurant: restaurantUser.restaurant };
    }

    async getAllApplications() {
        return this.restaurantUserRepo.find({
            where: { applicationStatus: ApplicationStatus.PENDING },
            relations: ['user', 'restaurant']
        });
    }

    async approveApplication(applicationId: string) {
        const restaurantUser = await this.restaurantUserRepo.findOne({
            where: { id: applicationId },
            relations: ['user', 'restaurant']
        });

        if (!restaurantUser) {
            throw new Error('Application not found');
        }

        restaurantUser.applicationStatus = ApplicationStatus.APPROVED;
        return this.restaurantUserRepo.save(restaurantUser);
    }

    async rejectApplication(applicationId: string) {
        const restaurantUser = await this.restaurantUserRepo.findOne({
            where: { id: applicationId },
            relations: ['user', 'restaurant']
        });
        if (!restaurantUser) {
            throw new Error('Application not found');
        }
        restaurantUser.applicationStatus = ApplicationStatus.REJECTED;
        return this.restaurantUserRepo.save(restaurantUser);
    }

}