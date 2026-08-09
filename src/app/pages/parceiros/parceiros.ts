import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteApiService, ParceiroPublico } from '../../services/site-api.service';

@Component({
  selector: 'app-parceiros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './parceiros.html',
  styleUrl: './parceiros.scss',
})
export class ParceirosPage implements OnInit {
  itens: ParceiroPublico[] = [];
  loading = true;
  filtroCidade = '';
  filtroEstado = '';
  filtroSegmento = '';

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.api
      .getParceiros({
        cidade: this.filtroCidade.trim() || undefined,
        estado: this.filtroEstado.trim() || undefined,
        segmento: this.filtroSegmento.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.itens = res.data || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.itens = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  formatPhone(v?: string | null): string {
    const d = (v || '').replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return v || '';
  }
}
