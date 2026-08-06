import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    UsersModule,

    /**
     * HS256 com segredo compartilhado.
     *
     * A alternativa é um par de chaves assimétricas (RS256/EdDSA), que permite
     * a terceiros verificarem o token sem poder assiná-lo. Isso importa quando
     * há vários serviços validando o mesmo token — não é o nosso caso: existe
     * uma API, que assina e valida. HS256 resolve com uma variável de ambiente
     * em vez de gestão de chaves.
     *
     * Se um dia houver um segundo serviço, a troca fica contida em
     * `TokenService` e neste registro.
     */
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, RefreshTokenRepository],
  /**
   * `TokenService` é exportado porque o guard global, registrado em
   * `AppModule`, precisa dele para verificar tokens.
   */
  exports: [TokenService],
})
export class AuthModule {}
