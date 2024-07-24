import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { CreateAgentDto } from "./dto/create-agent.dto";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post("start")
  async startAgent(@Body() createAgentDto: CreateAgentDto): Promise<string> {
    return await this.appService.startAgent(createAgentDto);
  }

  @Get("invite")
  async createInvitation(): Promise<String> {
    return await this.appService.createInvitation();
  }

  @Get("oob-invite")
  async createOOBInvitation(): Promise<String> {
    return await this.appService.createOOBInvitation();
  }

  // @Post("push-notifications/apns")
  // async sendApnsDeviceInfo(
  //   @Body() body: { connectionId: string; deviceToken: string }
  // ) {
  //   await this.appService.sendApnsDeviceInfo(
  //     body.connectionId,
  //     body.deviceToken
  //   );
  //   return { success: true };
  // }

  // @Get("push-notifications/apns/:connectionId")
  // async getApnsDeviceInfo(@Param("connectionId") connectionId: string) {
  //   return await this.appService.getApnsDeviceInfo(connectionId);
  // }

  // @Post("push-notifications/fcm")
  // async sendFcmDeviceInfo(
  //   @Body() body: { connectionId: string; deviceToken: string }
  // ) {
  //   await this.appService.sendFcmDeviceInfo(
  //     body.connectionId,
  //     body.deviceToken
  //   );
  //   return { success: true };
  // }

  // @Get("push-notifications/fcm/:connectionId")
  // async getFcmDeviceInfo(@Param("connectionId") connectionId: string) {
  //   return await this.appService.getFcmDeviceInfo(connectionId);
  // }
  // @Post("register-device-token")
  // async registerDeviceToken(
  //   @Body()
  //   body: {
  //     connectionId: string;
  //     deviceToken: string;
  //     platform: string;
  //   }
  // ) {
  //   if (!body.connectionId || !body.deviceToken || !body.platform) {
  //     throw new BadRequestException(
  //       "Missing required fields: connectionId, deviceToken, and platform are required"
  //     );
  //   }

  //   await this.appService.storeDeviceToken(
  //     body.connectionId,
  //     body.deviceToken,
  //     body.platform
  //   );
  //   return { success: true };
  // }
}
