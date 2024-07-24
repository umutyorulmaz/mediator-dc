import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { tsyringeContainerWrapper } from "./dependencies/register-dependencies";
import { useContainer } from "class-validator";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: console });

  useContainer(tsyringeContainerWrapper, { fallbackOnErrors: true });

  const config = new DocumentBuilder()
    .setTitle("DigCred Mediator")
    .setDescription("API for controlling the DigiCred Mediator")
    .setVersion("1.0")
    .addTag("mediator")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-1", app, document);

  await app.listen(3000);
}
bootstrap();
