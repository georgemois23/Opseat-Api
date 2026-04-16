// src/keep-alive/keep-alive.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron('*/10 * * * *') 
  async ping() {
    try {
      await axios.get(process.env.KEEP_ALIVE_URL || 'http://localhost:7001/health');
      this.logger.log('Keep-alive ping sent');
    } catch (error) {
      this.logger.error('Keep-alive ping failed', error.message);
    }
  }
}
