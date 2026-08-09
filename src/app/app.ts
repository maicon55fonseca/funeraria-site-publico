import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SiteApiService, SiteConfigPublica } from './services/site-api.service';
import { sanitizeSiteConfigMedia } from './utils/media-url';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  config: SiteConfigPublica | null = null;
  logoUrl: string | null = null;
  mobileOpen = false;
  year = new Date().getFullYear();

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Pintar shell imediatamente (zoneless) enquanto a config carrega
    this.aplicarCores();
    this.cdr.detectChanges();

    this.api.getConfig().subscribe({
      next: (res) => {
        this.config = sanitizeSiteConfigMedia(res.data);
        this.logoUrl = this.config?.url_logo || null;
        this.aplicarCores();
        this.cdr.detectChanges();
      },
      error: () => {
        this.config = {
          titulo_hero: 'Funerária Aliança',
          subtitulo_hero: 'Cuidado e acolhimento quando você mais precisa',
          cor_primaria: '#1a4d3e',
          cor_rodape: '#122820',
          cor_fonte_rodape: '#e8efe9',
        };
        this.logoUrl = null;
        this.aplicarCores();
        this.cdr.detectChanges();
      },
    });
  }

  onLogoError(): void {
    this.logoUrl = null;
    this.cdr.detectChanges();
  }

  footerStyles(): Record<string, string> {
    const bg = this.config?.cor_rodape || '#122820';
    const fg = this.config?.cor_fonte_rodape || '#e8efe9';
    return {
      'background-color': bg,
      color: fg,
      '--footer-bg': bg,
      '--footer-fg': fg,
    };
  }

  private aplicarCores(): void {
    const cor = this.config?.cor_primaria || '#1a4d3e';
    const rodape = this.config?.cor_rodape || '#122820';
    const fonteRodape = this.config?.cor_fonte_rodape || '#e8efe9';
    document.documentElement.style.setProperty('--brand', cor);
    document.documentElement.style.setProperty('--footer-bg', rodape);
    document.documentElement.style.setProperty('--footer-fg', fonteRodape);
  }

  /** Telefone principal = primeiro número (campo telefone); se vazio, WhatsApp. */
  numeroPrincipalDigits(): string {
    const raw = (this.config?.telefone || this.config?.whatsapp || '').replace(/\D+/g, '');
    return raw;
  }

  whatsappLink(): string | null {
    const raw = this.numeroPrincipalDigits();
    if (!raw) return null;
    const num = raw.startsWith('55') ? raw : `55${raw}`;
    return `https://wa.me/${num}`;
  }

  formatPhone(value?: string | null): string {
    const d = (value || '').replace(/\D/g, '').slice(0, 11);
    if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length > 6) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    if (d.length > 2) return d.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    return value || '';
  }

  temRedeSocial(): boolean {
    return !!(
      this.config?.url_instagram ||
      this.config?.url_facebook ||
      this.config?.url_youtube ||
      this.config?.url_tiktok
    );
  }
}
