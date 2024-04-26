import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('start')
  async startAgent(@Body() createAgentDto: CreateAgentDto): Promise<string> {
    return await this.appService.startAgent(createAgentDto);
  }

  @Get('invite')
  async createInvitation(): Promise<String> {
    return await this.appService.createInvitation();
  }

  @Get('oob-invite')
  async createOOBInvitation(): Promise<String> {
    return await this.appService.createOOBInvitation();
  }


}
