import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteApiService, PlanoPublico } from '../../services/site-api.service';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './planos.html',
  styleUrl: './planos.scss',
})
export class PlanosPage implements OnInit {
  planos: PlanoPublico[] = [];
  loading = true;
  erro = false;

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.getPlanos().subscribe({
      next: (res) => {
        this.planos = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erro = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  money(v: number | string | null | undefined): string {
    return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
