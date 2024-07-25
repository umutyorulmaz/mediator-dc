//firebase.service.ts
import { Injectable, forwardRef, OnModuleInit, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import {
  Agent,
  InjectionSymbols,
  AgentContextProvider,
  AgentContext,
  ConnectionsApi,
  ConnectionRecord,
} from "@credo-ts/core";
import { AppService } from "../app.service";
import {
  PushNotificationsFcmSetDeviceInfoMessage,
  PushNotificationsFcmApi,
  PushNotificationsApnsApi,
} from "@credo-ts/push-notifications";
import { PushNotificationsFcmDeviceInfoMessage } from "@credo-ts/push-notifications";

interface DeviceTokenInfo {
  deviceToken: string;
  devicePlatform: string;
  status?: "processed" | "unprocessed";
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private agent: Agent;
  private deviceTokens: Map<string, DeviceTokenInfo> = new Map();

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => AppService))
    private appService: AppService,
    @Inject(InjectionSymbols.AgentContextProvider)
    private agentContextProvider: AgentContextProvider
  ) {}

  //   private get agent(): Agent {
  //     return this.appService.getAgent();
  //   }

  async onModuleInit() {
    this.initializeFirebase();
    //this.registerMessageHandlers();
  }
  async initializeWithAgent(agent: Agent) {
    this.agent = agent;
    this.registerMessageHandlers();
  }

  private initializeFirebase() {
    const serviceAccount = JSON.parse(
      this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: this.configService.get<string>("FIREBASE_PROJECT_ID"),
    });
    console.log("Firebase initialized successfully");
  }

  private registerMessageHandlers() {
    console.log("Registering message handlers");
    if (!this.agent) {
      console.error("Agent not initialized");
      return;
    }
    this.agent.dependencyManager.registerMessageHandlers([
      {
        supportedMessages: [PushNotificationsFcmSetDeviceInfoMessage],
        handle: (messageContext) => {
          console.log(
            "Received message type:",
            messageContext.message["@type"]
          );
          return this.handleSetDeviceInfo.bind(this)(
            messageContext.connection.id,
            messageContext.message
          );
        },
      },
    ]);
    console.log("Message handlers registered successfully");
  }
  //we may eventually merge with saveDeviceToken
  async handleSetDeviceInfo(
    connectionId: string,
    message: PushNotificationsFcmDeviceInfoMessage
  ) {
    console.log("Received raw message (watch this):", JSON.stringify(message));
    console.log("Received message:", JSON.stringify(message, null, 2));

    // Adjust this line to handle potential different property names
    const { deviceToken, devicePlatform } = message;

    console.log(`Received device info for connection ${connectionId}:`);
    console.log(`Device Token: ${deviceToken}`);
    console.log(`Device Platform: ${devicePlatform}`);

    try {
      const agentContext =
        await this.agentContextProvider.getAgentContextForContextCorrelationId(
          connectionId
        );
      const pushNotificationsFcmApi = agentContext.dependencyManager.resolve(
        PushNotificationsFcmApi
      );
      console.log("Attempting to set device info with FCM API");

      await pushNotificationsFcmApi.setDeviceInfo(connectionId, {
        deviceToken: deviceToken || "",
        devicePlatform: devicePlatform || "android",
      });

      console.log(
        `Successfully saved device info for connection ${connectionId}`
      );

      // Log the stored information
      const storedInfo = await this.getDeviceToken(connectionId);
      console.log("Stored device info:", storedInfo);
    } catch (error) {
      console.error(
        `Error saving device info for connection ${connectionId}:`,
        error
      );
      throw error;
    }
  }

  //we may eventually merge with handleSetDeviceInfo
  async saveDeviceToken(
    connectionId: string,
    deviceToken: string,
    devicePlatform: string
  ) {
    if (!connectionId || !deviceToken || !devicePlatform) {
      throw new Error(
        "Missing required fields: connectionId, deviceToken, and devicePlatform are required"
      );
    }
    console.log(`Storing device token for connection: ${connectionId}`);
    console.log(`Platform: ${devicePlatform}`);
    console.log(`Device token: ${deviceToken}`);

    await this.agent.genericRecords.save({
      content: {
        deviceToken: deviceToken,
        devicePlatform: devicePlatform,
        updatedAt: new Date().toISOString(),
      },
      tags: {
        connectionId: connectionId,
      },
    });
    console.log(`Device token stored for connection: ${connectionId}`);

    try {
      if (devicePlatform.toLowerCase() === "android") {
        console.log(`Sending FCM device info for Android device`);
        await this.sendFcmDeviceInfo(connectionId, deviceToken, devicePlatform);
      } else if (devicePlatform.toLowerCase() === "ios") {
        console.log(`Sending APNS device info for iOS device`);
        await this.sendApnsDeviceInfo(connectionId, deviceToken);
      } else {
        console.warn(
          `Unknown platform: ${devicePlatform}. Device info not sent.`
        );
        this.deviceTokens.delete(connectionId);
        throw new Error(`Unsupported platform: ${devicePlatform}`);
      }
      console.log(
        `Successfully processed device token for connection: ${connectionId}`
      );
    } catch (error) {
      console.error(
        `Error processing device token for connection ${connectionId}:`,
        error
      );

      if (
        error.message.includes("invalid token") ||
        error.message.includes("Unsupported platform")
      ) {
        this.deviceTokens.delete(connectionId);
        console.log(`Removed invalid token for connection: ${connectionId}`);
      } else {
        this.deviceTokens.set(connectionId, {
          deviceToken,
          devicePlatform,
          status: "unprocessed",
        });
        console.log(
          `Marked token as unprocessed for connection: ${connectionId}`
        );
      }

      throw error;
    }
  }
  //to get already stored device token in the mediator side
  async getDeviceToken(connectionId: string): Promise<DeviceTokenInfo | null> {
    console.log(
      `Attempting to retrieve device token for connection: ${connectionId}`
    );
    try {
      const records = await this.agent.genericRecords.findAllByQuery({
        connectionId: connectionId,
      });
      console.log(
        `Found ${records.length} records for connection: ${connectionId}`
      );

      if (records.length > 0) {
        const { deviceToken, devicePlatform } = records[0].content;
        console.log(`Device token found for connection ${connectionId}:`);
        console.log(`Platform: ${devicePlatform}`);
        console.log(`Token: ${deviceToken}`);
        return { deviceToken, devicePlatform } as DeviceTokenInfo;
      }
      console.log(`No device token found for connection: ${connectionId}`);
      return null;
    } catch (error) {
      console.error("Error retrieving device token:", error);
      return null;
    }
  }

  async sendPushNotification(connectionId: string) {
    const deviceInfo = await this.getDeviceToken(connectionId);
    if (!deviceInfo) {
      console.log(
        `No device token found for connection ${connectionId} can NOT send notification`
      );
      return;
    }

    const message = {
      token: deviceInfo.deviceToken,
      notification: {
        title: this.configService.get<string>("FIREBASE_NOTIFICATION_TITLE"),
        body: this.configService.get<string>("FIREBASE_NOTIFICATION_BODY"),
      },
    };

    try {
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
    } catch (error) {
      console.log("Error sending message:", error);
    }
  }

  async sendApnsDeviceInfo(connectionId: string, deviceToken: string) {
    const agentContext =
      await this.agentContextProvider.getAgentContextForContextCorrelationId(
        connectionId
      );
    const pushNotificationsApnsApi = agentContext.dependencyManager.resolve(
      PushNotificationsApnsApi
    );
    await pushNotificationsApnsApi.setDeviceInfo(connectionId, { deviceToken });
  }

  async getApnsDeviceInfo(
    connectionId: string
  ): Promise<{ deviceToken: string; devicePlatform: string } | null> {
    console.log(
      `Attempting to retrieve APNS device info for connection: ${connectionId}`
    );
    try {
      const agentContext =
        await this.agentContextProvider.getAgentContextForContextCorrelationId(
          connectionId
        );
      const pushNotificationsApnsApi = agentContext.dependencyManager.resolve(
        PushNotificationsApnsApi
      );
      await pushNotificationsApnsApi.getDeviceInfo(connectionId);
      const deviceInfo = await this.getDeviceToken(connectionId);
      if (!deviceInfo) {
        console.log(`No device token found for connection: ${connectionId}`);
        return null;
      }
      console.log(`Device token found for connection ${connectionId}:`);
      console.log(`Device Token: ${deviceInfo.deviceToken}`);
      console.log(`Device Platform: ${deviceInfo.devicePlatform}`);
      return {
        deviceToken: deviceInfo.deviceToken,
        devicePlatform: deviceInfo.devicePlatform,
      };
    } catch (error) {
      console.error("Error retrieving APNS device info:", error);
      return null;
    }
  }

  async sendFcmDeviceInfo(
    connectionId: string,
    deviceToken: string,
    devicePlatform: string = "android"
  ) {
    console.log(
      `Attempting to send FCM device info for connection: ${connectionId}`
    );
    console.log(`Device token: ${deviceToken}`);
    console.log(`Device platform: ${devicePlatform}`);

    try {
      const agentContext =
        await this.agentContextProvider.getAgentContextForContextCorrelationId(
          connectionId
        );
      const pushNotificationsFcmApi = agentContext.dependencyManager.resolve(
        PushNotificationsFcmApi
      );
      await pushNotificationsFcmApi.setDeviceInfo(connectionId, {
        deviceToken,
        devicePlatform,
      });
      console.log(
        `Successfully sent FCM device info for connection: ${connectionId}`
      );
    } catch (error) {
      console.error(
        `Error sending FCM device info for connection ${connectionId}:`,
        error
      );
      throw error;
    }
  }

  async getFcmDeviceInfo(
    connectionId: string
  ): Promise<
    { deviceToken: string; devicePlatform: string } | { error: string }
  > {
    console.log(
      `Attempting to get FCM device info for connection: ${connectionId}`
    );
    try {
      const agentContext =
        await this.agentContextProvider.getAgentContextForContextCorrelationId(
          connectionId
        );
      const connectionRecord = await agentContext.dependencyManager
        .resolve(ConnectionsApi)
        .getById(connectionId);
      console.log(`Connection found: ${JSON.stringify(connectionRecord)}`);
      const pushNotificationsFcmApi = agentContext.dependencyManager.resolve(
        PushNotificationsFcmApi
      );
      await pushNotificationsFcmApi.getDeviceInfo(connectionId);
      const deviceInfo = await this.getDeviceToken(connectionId);
      if (!deviceInfo) {
        return { error: "Device info not found" };
      }
      console.log(`Device info retrieved: ${JSON.stringify(deviceInfo)}`);
      return {
        deviceToken: deviceInfo.deviceToken,
        devicePlatform: deviceInfo.devicePlatform,
      };
    } catch (error) {
      console.error(
        `Error getting FCM device info for connection ${connectionId}:`,
        error
      );
      return { error: `Failed to get FCM device info: ${error.message}` };
    }
  }
}
