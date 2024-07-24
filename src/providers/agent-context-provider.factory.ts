import { Provider } from "@nestjs/common";
import { InjectionSymbols, AgentContextProvider, AgentContext } from "@credo-ts/core";
import { DependencyManager } from "@credo-ts/core"; 

export const AgentContextProviderFactory: Provider = {
  provide: InjectionSymbols.AgentContextProvider,
  useFactory: (): AgentContextProvider => {
    return {
      async getContextForInboundMessage(inboundMessage: any, options?: { contextCorrelationId?: string }): Promise<AgentContext> {
        // Implement the logic to get the context based on the inbound message
        const contextCorrelationId = options?.contextCorrelationId || 'default';
        const dependencyManager = new DependencyManager(); // Initialize your DependencyManager
        return new AgentContext({ dependencyManager, contextCorrelationId });
      },
      async getAgentContextForContextCorrelationId(contextCorrelationId: string): Promise<AgentContext> {
        // Implement the logic to get the context based on the contextCorrelationId
        const dependencyManager = new DependencyManager(); // Initialize your DependencyManager
        return new AgentContext({ dependencyManager, contextCorrelationId });
      },
      async endSessionForAgentContext(agentContext: AgentContext): Promise<void> {
        // Implement the logic to end the session for the provided agent context
        console.log(`Ending session for context: ${agentContext.contextCorrelationId}`);
      },
    };
  },
};
