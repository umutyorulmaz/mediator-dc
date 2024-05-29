import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAgentDto } from './dto/create-agent.dto';
import {
  Agent,
  CacheModule,
  ConnectionsModule,
  HttpOutboundTransport,
  InMemoryLruCache,
  MediatorModule,
  InitConfig,
  WsOutboundTransport
  } from '@credo-ts/core'
import { 
    ProofEventTypes, 
    ProofStateChangedEvent, 
    BasicMessageRole,
    ConnectionStateChangedEvent,
    ConnectionEventTypes,
    DidExchangeState,
    BasicMessageStateChangedEvent,
    BasicMessageEventTypes,
    ConsoleLogger, 
    LogLevel
  } from '@aries-framework/core';
import { AskarModule, AskarMultiWalletDatabaseScheme  } from '@credo-ts/askar';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { Server } from 'ws';
import { HttpInboundTransport, agentDependencies, WsInboundTransport } from '@credo-ts/node'
import type { Socket } from 'net'
import { askarPostgresConfig } from './database';

@Injectable()
export class AppService {

  agentConfig: InitConfig;
  agent: Agent;
  socketServer: Server;

  constructor(private configService: ConfigService) {}
  
  async startAgent(createAgentDto: CreateAgentDto): Promise<string> {
      console.log("Agent DTO=", createAgentDto)

      // Create PostgreSQL storage configuration
      const storageConfig = askarPostgresConfig(this.configService);


      // Setup the configuration for the agent
      this.agentConfig = {
        endpoints: [createAgentDto.endpoint],
        label: createAgentDto.label,
        walletConfig: {
          id: createAgentDto.walletId,
          key: createAgentDto.walletKey,
          storage:storageConfig,
        },
        logger: new ConsoleLogger(LogLevel.info)
      }
  
      // Set up agent
      this.agent = new Agent({
        config: this.agentConfig,
        dependencies: agentDependencies,
        modules: {
          askar: new AskarModule({ ariesAskar,
            multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
           }),
          mediator: new MediatorModule({
            autoAcceptMediationRequests: true,
          }),
          connections: new ConnectionsModule({
            autoAcceptConnections: true,
          }),
          cache: new CacheModule({
            cache: new InMemoryLruCache({ limit: 500 }),
          }),
        },
      });
  
      // Initialize websocket server
      this.socketServer = new Server({ noServer: true });
      console.log("Created socketServer");
  
      // Create all transports
      const httpInboundTransport = new HttpInboundTransport({port: createAgentDto.port })
      const httpOutboundTransport = new HttpOutboundTransport()
      const wsInboundTransport = new WsInboundTransport({ server: this.socketServer })
      const wsOutboundTransport = new WsOutboundTransport()
      console.log("Created transports");
  
      // Register all Transports
      this.agent.registerInboundTransport(httpInboundTransport)
      this.agent.registerOutboundTransport(httpOutboundTransport)
      this.agent.registerInboundTransport(wsInboundTransport)
      this.agent.registerOutboundTransport(wsOutboundTransport)
      console.log("Registered transports");
  
      // Initialize agent
      console.log("Agent pre-initialize");
      await this.agent.initialize().catch(console.error);
      console.log("Agent initialized");
  
      httpInboundTransport.server?.on('upgrade', (request, socket, head) => {
        this.socketServer.handleUpgrade(request, socket as Socket, head, (socket) => {
          this.socketServer.emit('connection', socket, request)
        })
      })
  
      return "OK";
 }
  

  async createInvitation(): Promise<String> {
    var outOfBandRecord = await this.agent.oob.createLegacyInvitation()
    var invite = {
      invitationUrl: outOfBandRecord.invitation.toUrl({ domain: this.agent.config.endpoints[0] }),
      outOfBandRecord
    }
    return invite.invitationUrl
  }

  async createOOBInvitation(): Promise<String> {
    const outOfBandRecord = await this.agent.oob.createInvitation({ multiUseInvitation: true })
    var invite = {
      invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({ domain: this.agent.config.endpoints[0] }),
      outOfBandRecord,
    }
    return invite.invitationUrl
  }


  setupProofRequestListener() {
    console.log("Listen for proof")
    this.agent.events.on(ProofEventTypes.ProofStateChanged, async ({ payload }: ProofStateChangedEvent) => {
      //console.log("Proof presentation=",payload.proofRecord )
      console.log("Proof state: ", payload.proofRecord?.state)
      console.log("Proof verified: ", payload.proofRecord?.isVerified ? 'Verified' : 'not Verified')
    })
  }

  setupMessageListener() {
    console.log("Listen for messages")
    this.agent.events.on(BasicMessageEventTypes.BasicMessageStateChanged, async ({ payload }: BasicMessageStateChangedEvent) => {
      if (payload.basicMessageRecord.role === BasicMessageRole.Receiver) {
        console.log("Message:",payload.message.content);
      }
    })
  }

  setupConnectionListener = () => {
    this.agent.events.on<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged, ({ payload }) => {
      if (payload.connectionRecord.state === DidExchangeState.Completed) {
        // the connection is now ready for usage in other protocols!
        console.log("Connection completed", payload.connectionRecord)
        //this.afjAgent.connection_id = payload.connectionRecord.id
        //process.exit(0)
      }
      else {
        console.log("Connection status", payload.connectionRecord)
      }
    })
  }

}

