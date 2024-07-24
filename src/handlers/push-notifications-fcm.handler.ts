import {
  MessageHandler,
  InboundMessageContext,
  InjectionSymbols,
  AgentContext,
  AgentContextProvider,
} from "@credo-ts/core";
import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import { PushNotificationsFcmSetDeviceInfoMessage } from "@credo-ts/push-notifications";

@Injectable()
export class PushNotificationsFcmHandler implements MessageHandler {
  public readonly supportedMessages = [
    PushNotificationsFcmSetDeviceInfoMessage,
  ];

  constructor(
    private firebaseService: FirebaseService,
    @Inject(InjectionSymbols.AgentContextProvider)
    private agentContextProvider: AgentContextProvider
  ) {}

  public async handle(
    messageContext: InboundMessageContext<PushNotificationsFcmSetDeviceInfoMessage>
  ) {
    console.log("PushNotificationsFcmHandler.handle called");
    const { message, connection } = messageContext;

    if (!connection) {
      throw new Error("Connection not found for incoming message");
    }

    // Get the AgentContext using the inbound message
    const agentContext =
      await this.agentContextProvider.getContextForInboundMessage(message);
    console.log("About to call handleSetDeviceInfo");

    await this.firebaseService.handleSetDeviceInfo(connection.id, message);
    console.log("handleSetDeviceInfo called successfully"); // Add this line
  }
}
