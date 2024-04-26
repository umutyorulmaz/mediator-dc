import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: console});

  const config = new DocumentBuilder()
  .setTitle('DigCred Mediator')
  .setDescription('API for controlling the DigiCred Mediator')
  .setVersion('1.0')
  .addTag('mediator')
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-1', app, document);

  await app.listen(3000);
}
bootstrap();
