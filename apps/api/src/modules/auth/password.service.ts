import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Hash e verificação de senha.
 *
 * Isolado do `AuthService` de propósito: algoritmo de hash é a peça com maior
 * probabilidade de troca ao longo dos anos — foi bcrypt, virou Argon2, e um
 * dia será outra coisa. Contido aqui, trocar não toca a regra de negócio.
 *
 * Argon2id é a recomendação atual do OWASP. Ele é *deliberadamente lento*:
 * cerca de 50 ms por verificação. Isso é a proteção, não um defeito — torna
 * inviável testar bilhões de senhas contra um banco vazado.
 *
 * Usamos `@node-rs/argon2` (implementação em Rust, com binários pré-compilados)
 * em vez do pacote `argon2`, que exige toolchain de compilação nativa na
 * máquina e na imagem Docker.
 */
@Injectable()
export class PasswordService {
  /**
   * Parâmetros conforme recomendação do OWASP para Argon2id.
   * `memoryCost` em KiB — 19 MiB. Aumentar torna o hash mais caro para um
   * atacante, mas também para o nosso servidor; estes valores são o equilíbrio
   * padrão recomendado.
   */
  private readonly options = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  /** Hash descartável, calculado uma vez. Ver `verifyAgainstDummy`. */
  private dummyHash?: Promise<string>;

  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, this.options);
  }

  /**
   * Verifica a senha.
   *
   * Nunca lança: hash malformado no banco (dado corrompido, migração ruim) é
   * tratado como senha incorreta. Propagar a exceção transformaria um registro
   * defeituoso em erro 500 e revelaria ao cliente que aquele e-mail existe.
   */
  async verify(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await verify(hashedPassword, plainPassword, this.options);
    } catch {
      return false;
    }
  }

  /**
   * Verifica a senha contra um hash descartável, em tempo equivalente ao de
   * uma verificação real.
   *
   * Serve à defesa contra enumeração de usuários no login: sem isso, um e-mail
   * inexistente responderia em ~1 ms e um e-mail existente com senha errada em
   * ~50 ms — e essa diferença revela quais contas existem.
   *
   * O hash é gerado uma única vez, sob demanda, a partir de uma senha aleatória,
   * e não escrito como constante no código. Um valor fixo digitado à mão corre
   * o risco de ser malformado, e o Argon2 rejeitaria um hash inválido já no
   * parse, retornando rápido demais. O resultado seria uma proteção que aparenta
   * funcionar e não funciona.
   */
  async verifyAgainstDummy(plainPassword: string): Promise<void> {
    this.dummyHash ??= this.hash(randomBytes(32).toString('hex'));
    await this.verify(await this.dummyHash, plainPassword);
  }
}
