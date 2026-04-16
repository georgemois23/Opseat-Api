import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module'; 
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Middleware
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());

  // 2. Optimized CORS
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    frontendUrl,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const isLocalIp = /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin);
      
      if (allowedOrigins.includes(origin) || isLocalIp) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT ?? 7001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();