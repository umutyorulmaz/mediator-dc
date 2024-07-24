import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FirebaseService } from "./firebase.service";
import { FirebaseController } from "./firebase.controller";
import { AppModule } from "../app.module";

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AppModule), // Use forwardRef here
  ],
  providers: [FirebaseService],
  controllers: [FirebaseController],
  exports: [FirebaseService],
})
export class FirebaseModule {}
