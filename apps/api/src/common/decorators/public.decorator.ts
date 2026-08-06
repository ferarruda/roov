import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como acessível sem autenticação.
 *
 * O guard é global: por padrão, tudo exige token. Este decorator é a exceção
 * explícita.
 *
 * A escolha por "fechado por padrão, aberto por exceção" é deliberada.
 * No modelo inverso — proteger rota a rota — esquecer o guard expõe dados em
 * silêncio, e ninguém percebe até vazar. Aqui, esquecer o decorator devolve
 * 401 e o erro aparece no primeiro teste.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
