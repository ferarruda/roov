import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/app-config.service';
import type { UserRole } from '@prisma/client';
import type { StringValue } from 'ms';

/** Conteúdo do access token. Mantido mínimo de propósito — ver nota abaixo. */
export interface AccessTokenPayload {
  /** `sub` é o campo padrão do JWT para identificar o usuário. */
  sub: string;
  role: UserRole;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Assina o access token.
   *
   * O payload carrega só `sub` e `role`. Tentação comum é embutir nome, e-mail
   * e avatar para "economizar uma consulta" — é um erro: o JWT não é revogável,
   * então todo dado embutido nele fica congelado até expirar. Um usuário
   * rebaixado de admin continuaria admin pelo resto da validade do token.
   *
   * `role` está aí apesar disso, com a mesma ressalva aceita conscientemente:
   * mudança de papel só vale após a renovação, em até 15 minutos. É o preço de
   * não consultar o banco a cada requisição.
   */
  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      // @types/jsonwebtoken tipa `expiresIn` como `StringValue` (formato do
      // pacote `ms`, ex. "15m"). JWT_ACCESS_TTL já é validado nesse formato
      // pelo env schema; o cast só alinha o tipo, sem mudar o valor em runtime.
      expiresIn: this.config.jwtAccessTtl as StringValue,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    // Lança em token inválido, expirado ou com assinatura adulterada.
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  /**
   * Gera um refresh token opaco.
   *
   * Opaco (bytes aleatórios) e não um segundo JWT. Motivo: JWT é auto-contido
   * e válido enquanto não expira — exatamente o oposto do que se quer num
   * token cujo propósito é ser revogável. Um valor aleatório só tem significado
   * porque existe uma linha no banco apontando para ele; apagar a linha invalida
   * o token instantaneamente.
   *
   * 32 bytes = 256 bits de entropia. Não é adivinhável.
   */
  generateRefreshToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hashRefreshToken(token) };
  }

  /**
   * SHA-256 do refresh token, para consulta e armazenamento.
   *
   * Determinístico de propósito: precisamos localizar a linha correspondente a
   * um token recebido. Argon2, que usa salt aleatório, tornaria a busca
   * impossível sem varrer a tabela inteira. Aqui isso é seguro porque o token
   * é aleatório e de alta entropia — não há dicionário para atacar.
   */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Data de expiração do refresh token, a partir de agora. */
  refreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.refreshTokenTtlDays);
    return expiresAt;
  }
}
