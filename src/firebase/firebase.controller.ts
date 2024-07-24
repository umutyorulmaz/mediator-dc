import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody } from "@nestjs/swagger";
import { FirebaseService } from "./firebase.service";

@ApiTags("firebase")
@Controller("firebase")
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post("register-device-token")
  @ApiOperation({ summary: "Register device token for a connection" })
  @ApiBody({
    schema: {
      properties: {
        connectionId: { type: "string" },
        deviceToken: { type: "string" },
        platform: { type: "string", enum: ["ios", "android"] },
      },
    },
  })
  async registerDeviceToken(
    @Body()
    body: {
      connectionId: string;
      deviceToken: string;
      platform: string;
    }
  ) {
    if (!body.connectionId || !body.deviceToken || !body.platform) {
      throw new BadRequestException(
        "Missing required fields: connectionId, deviceToken, and platform are required"
      );
    }
    try {
      await this.firebaseService.saveDeviceToken(
        body.connectionId,
        body.deviceToken,
        body.platform
      );
      return { success: true };
    } catch (error) {
      throw new BadRequestException(
        `Failed to register device token: ${error.message}`
      );
    }
  }

  @Post(":connectionId/send")
  @ApiOperation({ summary: "Send push notification to a connection" })
  @ApiParam({ name: "connectionId", type: "string" })
  async sendNotification(@Param("connectionId") connectionId: string) {
    await this.firebaseService.sendPushNotification(connectionId);
    return { success: true };
  }

  @Get("push-notifications/apns/:connectionId")
  @ApiOperation({ summary: "Get APNS device info for a connection" })
  @ApiParam({ name: "connectionId", type: "string" })
  async getApnsDeviceInfo(@Param("connectionId") connectionId: string) {
    try {
      const result = await this.firebaseService.getApnsDeviceInfo(connectionId);
      if (!result) {
        throw new BadRequestException("Device info not found");
      }
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to get APNS device info: ${error.message}`
      );
    }
  }

  @Get("push-notifications/fcm/:connectionId")
  @ApiOperation({ summary: "Get FCM device info for a connection" })
  @ApiParam({ name: "connectionId", type: "string" })
  async getFcmDeviceInfo(@Param("connectionId") connectionId: string) {
    try {
      const result = await this.firebaseService.getFcmDeviceInfo(connectionId);
      if ("error" in result) {
        throw new BadRequestException(result.error);
      }
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to get FCM device info: ${error.message}`
      );
    }
  }
}
