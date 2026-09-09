/**
 * Autenticação real — fala com `apps/api`, nunca com o mock.
 *
 * Deliberadamente separado de `services/index.js`: o resto do app (lugares,
 * feed, perfil com XP) continua 100% mock por enquanto. Só o portão de
 * entrada (cadastro/login/logout) é real.
 */

import { apiRequest } from './apiClient.js';

const SESSION_KEY = 'roov.session';

/** @typedef {{ accessToken: string, refreshToken: string, user: object }} Session */

/** @returns {Session | null} */
export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {Session} session */
export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const authService = {
  /** @param {{ email: string, username: string, name: string, password: string }} data */
  async register(data) {
    return apiRequest('/auth/register', { method: 'POST', body: data });
  },

  /** @param {{ email: string, password: string }} data */
  async login(data) {
    return apiRequest('/auth/login', { method: 'POST', body: data });
  },

  /** @param {string} refreshToken */
  async refresh(refreshToken) {
    return apiRequest('/auth/refresh', { method: 'POST', body: { refreshToken } });
  },

  /** @param {string} refreshToken */
  async logout(refreshToken) {
    return apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } });
  },

  /** @param {string} accessToken */
  async me(accessToken) {
    return apiRequest('/auth/me', { accessToken });
  },

  /**
   * @param {string} accessToken
   * @param {{ currentPassword: string, newPassword: string }} data
   */
  async changePassword(accessToken, data) {
    return apiRequest('/auth/change-password', { method: 'POST', body: data, accessToken });
  },
};
