// src/geocoding/geocoding.service.ts
import { Injectable,  } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeolocationService {
  constructor(private readonly httpService: HttpService) {}

  async getCoordinates(
    street: string,
    streetNumber: string,
    city: string,
    country: string,
    postalCode: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const address = encodeURIComponent(`${street} ${streetNumber}, ${city}, ${postalCode}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=1`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent': 'Opseat-App (opseat@gmail.com)', 
          },
        }),
      );

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        return { lat: parseFloat(location.lat), lon: parseFloat(location.lon) };
      }

      return null;
    } catch (error) {
      console.error('OSM Geocoding error:', error);
      return null;
    }
  }
}