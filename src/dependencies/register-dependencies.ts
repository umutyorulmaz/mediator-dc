import { container, DependencyContainer } from "tsyringe";
import {
  InjectionSymbols,
  ConnectionsApi,
  MessageSender,
  TransportService,
  AgentContext,
} from "@credo-ts/core";
import {
  PushNotificationsFcmApi,
  PushNotificationsApnsApi,
} from "@credo-ts/push-notifications";
import { AgentContextProviderFactory } from "../providers/agent-context-provider.factory";

class TsyringeContainerWrapper {
  private containerInstance: DependencyContainer;

  constructor(containerInstance: DependencyContainer) {
    this.containerInstance = containerInstance;
  }

  get(someClass: any) {
    return this.containerInstance.resolve(someClass);
  }
}

export function registerDependencies() {
  // Register Logger (using console as a simple logger)
  container.register(InjectionSymbols.Logger, {
    useValue: console,
  });

  // Register PushNotificationsFcmApi
  container.register<PushNotificationsFcmApi>("PushNotificationsFcmApi", {
    useClass: PushNotificationsFcmApi,
  });

  // Register PushNotificationsApnsApi
  container.register<PushNotificationsApnsApi>("PushNotificationsApnsApi", {
    useClass: PushNotificationsApnsApi,
  });

  // Register ConnectionsApi
  container.register<ConnectionsApi>("ConnectionsApi", {
    useClass: ConnectionsApi,
  });
  // Register MessageSender
  container.register<MessageSender>("MessageSender", {
    useClass: MessageSender,
  });

  // Register TransportService
  container.register<TransportService>("TransportService", {
    useClass: TransportService,
  });

  // Register AgentContext
  container.register<AgentContext>("AgentContext", {
    useClass: AgentContext,
  });

  // Register AgentContextProvider
  container.register(InjectionSymbols.AgentContextProvider, {
    useFactory: () => AgentContextProviderFactory,
  });

  // Register other dependencies as needed
}

export const tsyringeContainerWrapper = new TsyringeContainerWrapper(container);
