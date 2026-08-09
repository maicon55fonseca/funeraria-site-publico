import { SiteConfigPublica } from '../services/site-api.service';

/**
 * Normaliza URLs de mídia vindas da API.
 * Em produção, URLs localhost/127.0.0.1 não funcionam no browser do visitante.
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // data: ok
  if (trimmed.startsWith('data:')) return trimmed;

  // API às vezes devolve http:// no Railway — site é HTTPS
  if (/^http:\/\/funeraria-backend.*\.up\.railway\.app\//i.test(trimmed)) {
    return trimmed.replace(/^http:/i, 'https:');
  }

  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed);
  // /storage no Railway multi-réplica costuma 404 — não usar como logo
  const isRailwayStorage =
    /funeraria-backend.*\.up\.railway\.app\/storage\//i.test(trimmed) ||
    /^https?:\/\/[^/]+\/storage\/site\//i.test(trimmed);

  if (isLocal || isRailwayStorage) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[site] Imagem com URL inválida ignorada. Reenvie logo/banner em Site → Configuração.',
        trimmed
      );
    }
    return null;
  }

  return trimmed;
}

export function sanitizeSiteConfigMedia(config: SiteConfigPublica | null | undefined): SiteConfigPublica | null {
  if (!config) return null;
  const banners = (config.banners || [])
    .map((b) => ({ ...b, url_imagem: resolveMediaUrl(b.url_imagem) || '' }))
    .filter((b) => !!b.url_imagem);
  const urlBanner = resolveMediaUrl(config.url_banner);
  return {
    ...config,
    url_logo: resolveMediaUrl(config.url_logo),
    url_banner: urlBanner,
    banners: banners.length
      ? banners
      : urlBanner
        ? [{ id: 0, url_imagem: urlBanner, ordem: 1 }]
        : [],
  };
}
