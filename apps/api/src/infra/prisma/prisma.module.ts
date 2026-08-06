import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global porque a conexão com o banco é infraestrutura compartilhada e deve
 * existir uma única vez no processo. O acesso continua restrito: só
 * repositórios injetam `PrismaService`.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
