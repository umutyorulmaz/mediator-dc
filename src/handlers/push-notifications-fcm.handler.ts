import {
  MessageHandler,
  InboundMessageContext,
  InjectionSymbols,
  AgentContextProvider,
} from "@credo-ts/core";
import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import {
  PushNotificationsFcmSetDeviceInfoMessage,
  PushNotificationsFcmDeviceInfoMessage,
} from "@credo-ts/push-notifications";

@Injectable()
export class PushNotificationsFcmHandler implements MessageHandler {
  public readonly supportedMessages = [
    PushNotificationsFcmSetDeviceInfoMessage,
    PushNotificationsFcmDeviceInfoMessage,
  ];

  constructor(
    private firebaseService: FirebaseService,
    @Inject(InjectionSymbols.AgentContextProvider)
    private agentContextProvider: AgentContextProvider
  ) {}

  public async handle(
    messageContext: InboundMessageContext<
      | PushNotificationsFcmSetDeviceInfoMessage
      | PushNotificationsFcmDeviceInfoMessage
    >
  ) {
    console.log("PushNotificationsFcmHandler.handle called");
    const { message, connection } = messageContext;

    if (!connection) {
      console.error("Connection not found for incoming message");
      throw new Error("Connection not found for incoming message");
    }

    console.log(
      "Received device info message:",
      JSON.stringify(message, null, 2)
    );

    try {
      // Get the AgentContext using the inbound message
      const agentContext =
        await this.agentContextProvider.getContextForInboundMessage(message);
      console.log("AgentContext obtained successfully");

      console.log("About to call handleSetDeviceInfo");
      await this.firebaseService.handleSetDeviceInfo(connection.id, message);
      console.log("handleSetDeviceInfo called successfully");
    } catch (error) {
      console.error("Error in PushNotificationsFcmHandler:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error; // Re-throw the error to be handled by the outer error handling mechanism
    }
  }
}
