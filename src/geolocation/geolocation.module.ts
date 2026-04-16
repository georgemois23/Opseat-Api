import { Module } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { HttpModule } from '@nestjs/axios';
// import { GeolocationController } from './geolocation.controller';

@Module({
    controllers: [],
    imports: [HttpModule],
    providers: [GeolocationService],
    exports: [GeolocationService],
})
export class GeolocationModule {}