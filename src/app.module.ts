import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FirebaseModule } from "./firebase/firebase.module";
import { PushNotificationsFcmHandler } from "./handlers/push-notifications-fcm.handler";
import { AgentContextProviderFactory } from "./providers/agent-context-provider.factory";
import { registerDependencies } from "./dependencies/register-dependencies";

registerDependencies();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    forwardRef(() => FirebaseModule), // Use forwardRef here
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PushNotificationsFcmHandler,
    AgentContextProviderFactory,
  ],
  exports: [
    AppService,
    PushNotificationsFcmHandler,
    AgentContextProviderFactory,
  ],
})
export class AppModule {}
