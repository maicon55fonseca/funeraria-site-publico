import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const fallbackApi = 'https://funeraria-backend-production.up.railway.app/api';

const normalizeApi = (value) => {
  const v = (value || '').trim();
  if (!v) return fallbackApi;
  return v.endsWith('/') ? v.slice(0, -1) : v;
};

/** Opcional: força o "dominio" enviado à API (útil no *.vercel.app antes do DNS final). */
const dominioSite = (process.env.NG_APP_SITE_DOMINIO || '').trim();

const apiUrl = normalizeApi(process.env.NG_APP_API_URL);
const outputPath = resolve(process.cwd(), 'public', 'app-config.js');

mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });

const content = `window.__APP_CONFIG__ = window.__APP_CONFIG__ || ${JSON.stringify({
  apiUrl,
  dominioSite: dominioSite || null,
})};`;

writeFileSync(outputPath, `${content}\n`, 'utf8');
console.log(`[app-config] apiUrl=${apiUrl} dominioSite=${dominioSite || '(hostname do browser)'}`);
