import { SiteConfigPublica } from '../services/site-api.service';

/**
 * Normaliza URLs de mídia vindas da API.
 * Em produção, URLs localhost/127.0.0.1 não funcionam no browser do visitante.
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // data: e https públicos ok
  if (trimmed.startsWith('data:')) return trimmed;

  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed);

  if (isLocal) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[site] Imagem com URL local ignorada em produção. Reenvie logo/banner pelo sistema (Site → Configuração).',
        trimmed
      );
    }
    return null;
  }

  return trimmed;
}

export function sanitizeSiteConfigMedia(config: SiteConfigPublica | null | undefined): SiteConfigPublica | null {
  if (!config) return null;
  return {
    ...config,
    url_logo: resolveMediaUrl(config.url_logo),
    url_banner: resolveMediaUrl(config.url_banner),
  };
}
