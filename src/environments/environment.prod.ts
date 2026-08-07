const runtime = (globalThis as any)?.__APP_CONFIG__ as
  | { apiUrl?: string; dominioSite?: string | null }
  | undefined;

const fallbackApi = 'https://funeraria-backend-production.up.railway.app/api';

export const environment = {
  production: true,
  apiUrl: (runtime?.apiUrl || fallbackApi).replace(/\/$/, ''),
  /** Se preenchido via app-config, usa este domínio na API em vez do hostname atual. */
  dominioSite: (runtime?.dominioSite || '').trim() || null,
};
