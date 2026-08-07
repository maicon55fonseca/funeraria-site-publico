import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteApiService, SiteConfigPublica, PlanoPublico } from '../../services/site-api.service';
import { sanitizeSiteConfigMedia } from '../../utils/media-url';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit {
  config: SiteConfigPublica | null = null;
  planos: PlanoPublico[] = [];
  loadingPlanos = true;

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.getConfig().subscribe({
      next: (res) => {
        this.config = sanitizeSiteConfigMedia(res.data);
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
  }

  money(v: number | string | null | undefined): string {
    const n = Number(v ?? 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
