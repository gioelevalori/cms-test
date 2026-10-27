import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody serve a verificare la firma dei webhook WhatsApp
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Più origini separate da virgola, es. "https://admin.example.com,http://localhost:5173"
  app.enableCors({ origin: (process.env.ADMIN_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()) });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API in ascolto su http://localhost:${port}`);
}
bootstrap();
