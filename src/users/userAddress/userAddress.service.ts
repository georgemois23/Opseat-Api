import { HttpException, HttpStatus, Injectable, } from "@nestjs/common";
import { User } from "../entities/users.entity";
import { CreateUserAddressDto } from "./dto/create-user-address.dto";
import { firstValueFrom } from "rxjs";
import { GeolocationService } from "../../geolocation/geolocation.service";
import { InjectRepository } from "@nestjs/typeorm";
import { UserAddress } from "./entities/UserAddress.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserAddressService {
    constructor(
         private readonly geolocationService: GeolocationService,
        @InjectRepository(UserAddress) private userAddressRepo: Repository<UserAddress>
        ) {}
    async addUserAddress(user: User, addressData: CreateUserAddressDto) {
    const { street, streetNumber, city, country, postalCode, label } = addressData;

    const hasAddress = await this.userAddressRepo.findOne({ where: { user} });
    const isFirstAddress = !hasAddress;
    const existing = await this.userAddressRepo.findOne({
  where: {
    user: { id: user.id },
    longitude: await this.geolocationService.getCoordinates(street, streetNumber, city, country, postalCode).then(coords => coords?.lon),
    latitude: await this.geolocationService.getCoordinates(street, streetNumber, city, country, postalCode).then(coords => coords?.lat),
  },
});
    if (existing) {
  throw new HttpException(
    'This address already exists in your saved addresses',
    HttpStatus.CONFLICT, 
  );
}

    const longlat = await this.geolocationService.getCoordinates(street, streetNumber, city, country, postalCode);

    if (!longlat) {
      throw new Error('Unable to geocode the provided address');
    }

    return this.userAddressRepo.save({
        user,
        label: label && label.trim() !== '' ? label : 'Home',
        street,
        streetNumber,
        city,
        country,
        postalCode,
        longitude: longlat.lon,
        latitude: longlat.lat,
        isDefault: isFirstAddress,
    });
  }

    async getUserAddresses(user: User) {
    return this.userAddressRepo.find({ where: { user } });
  }

  async updateUserAddress(user: User, addressId: string, addressData: CreateUserAddressDto) {
    const address = await this.userAddressRepo.findOne({ where: { id: addressId, user } });
    if (!address) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }
    const { street, streetNumber, city, country, postalCode, label } = addressData;
    const longlat = await this.geolocationService.getCoordinates(street, streetNumber, city, country, postalCode);
    if (!longlat) {
      throw new Error('Unable to geocode the provided address');
    }
    address.street = street;
    address.streetNumber = streetNumber;
    address.city = city;
    address.country = country;
    address.postalCode = postalCode;
    address.latitude = longlat.lat;
    address.longitude = longlat.lon;
    address.label = label && label.trim() !== '' ? label : address.label;
    return this.userAddressRepo.save(address);
  }
  
  async deleteUserAddress(user: User, addressId: string) {
    const address = await this.userAddressRepo.findOne({ where: { id: addressId, user } });
    if (!address) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }
    await this.userAddressRepo.softDelete({ id: addressId });
    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(user: User, addressId: string) {
    const address = await this.userAddressRepo.findOne({ where: { id: addressId, user } });
    if (!address) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }
    await this.userAddressRepo.update({ user }, { isDefault: false });
    await this.userAddressRepo.update({ id: addressId }, { isDefault: true });
    return this.userAddressRepo.findOne({ where: { id: addressId } });
  }     
}