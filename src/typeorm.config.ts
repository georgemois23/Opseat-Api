import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as path from 'path';

dotenv.config();

// Check if we are running in production (compiled JS) or dev (TS)
const isCompiled = path.extname(__filename) === '.js';
const ext = isCompiled ? 'js' : 'ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Use path.join for absolute paths relative to *this* file
  entities: [
    path.join(__dirname, `**/*.entity.${ext}`)
  ],
  
  // Dynamic migration path
  migrations: [
    path.join(__dirname, `migrations/*.${ext}`)
  ],

  logging: true,
  synchronize: false,
  extra: {
  prepareThreshold: 0,
  max: 1,   
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
},
});