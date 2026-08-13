/**
 * Edição de informações do perfil — fala com `apps/api`, não com o mock.
 * Mesmo padrão de `services/auth.js`.
 */

import { apiRequest } from './apiClient.js';

export const usersService = {
  /**
   * @param {string} accessToken
   * @param {{ name?: string, bio?: string, city?: string, state?: string, country?: string }} data
   */
  async updateMe(accessToken, data) {
    return apiRequest('/users/me', { method: 'PATCH', body: data, accessToken });
  },
};
