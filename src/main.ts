import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  app.enableCors(
    {origin:['*','http://localhost:5173'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    }
  )
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipUndefinedProperties: true,
    }),
  );
  // app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);
}
bootstrap();
