import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({
    description: 'Agent label',
    example: "digicred-mediator",
  })
  label: string;

  @ApiProperty({
    description: 'Wallet ID',
    example: "digicred-wallet",
  })
  walletId: string;

  @ApiProperty({
    description: 'Wallet Key',
    example: "digicred-key",
  })
  walletKey: string;

  @ApiProperty({
    description: 'Mediator endpoint',
    example: "http://192.168.2.247:3002",
  })
  endpoint: string;

  @ApiProperty({
    description: 'Mediator port',
    example: 3002,
  })
  port: number;

}