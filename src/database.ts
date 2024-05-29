import { ConfigService } from '@nestjs/config';
import type { AskarWalletPostgresStorageConfig } from '@credo-ts/askar/build/wallet';

export const askarPostgresConfig = (configService: ConfigService): AskarWalletPostgresStorageConfig => ({
  type: 'postgres',
  config: {
    host: configService.get<string>('POSTGRES_HOST'),
    connectTimeout: 10,
  },
  credentials: {
    account: configService.get<string>('POSTGRES_ACCOUNT'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    adminAccount: configService.get<string>('POSTGRES_ADMIN_ACCOUNT'),
    adminPassword: configService.get<string>('POSTGRES_ADMIN_PASSWORD'),
  },
});
