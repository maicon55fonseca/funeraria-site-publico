import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteApiService, SiteConfigPublica, PlanoPublico, ComentarioPublico } from '../../services/site-api.service';
import { sanitizeSiteConfigMedia } from '../../utils/media-url';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit, OnDestroy {
  config: SiteConfigPublica | null = null;
  planos: PlanoPublico[] = [];
  depoimentos: ComentarioPublico[] = [];
  bannerSlides: { id: number; url_imagem: string; ordem?: number }[] = [];
  slideIndex = 0;
  slidePausado = false;
  configLoaded = false;
  loadingPlanos = true;
  loadingDepoimentos = true;
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.getConfig().subscribe({
      next: (res) => {
        this.config = sanitizeSiteConfigMedia(res.data);
        this.bannerSlides = this.config?.banners || [];
        this.slideIndex = 0;
        this.configLoaded = true;
        this.iniciarSlider();
        this.cdr.detectChanges();
      },
      error: () => {
        this.configLoaded = true;
        this.cdr.detectChanges();
      },
    });
    this.api.getPlanos().subscribe({
      next: (res) => {
        this.planos = (res.data || []).slice(0, 3);
        this.loadingPlanos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPlanos = false;
        this.cdr.detectChanges();
      },
    });
    this.api.getComentarios().subscribe({
      next: (res) => {
        this.depoimentos = res.data || [];
        this.loadingDepoimentos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.depoimentos = [];
        this.loadingDepoimentos = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.pararSlider();
  }

  irParaSlide(i: number): void {
    this.slideIndex = i;
    if (!this.slidePausado) {
      this.iniciarSlider();
    }
    this.cdr.detectChanges();
  }

  alternarPauseSlide(): void {
    this.slidePausado = !this.slidePausado;
    if (this.slidePausado) {
      this.pararSlider();
    } else {
      this.iniciarSlider();
    }
    this.cdr.detectChanges();
  }

  private iniciarSlider(): void {
    this.pararSlider();
    if (this.slidePausado || this.bannerSlides.length < 2) return;
    this.slideTimer = setInterval(() => {
      this.slideIndex = (this.slideIndex + 1) % this.bannerSlides.length;
      this.cdr.detectChanges();
    }, 5000);
  }

  private pararSlider(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  money(v: number | string | null | undefined): string {
    const n = Number(v ?? 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
