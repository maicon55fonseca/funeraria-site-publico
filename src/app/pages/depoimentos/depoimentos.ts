import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteApiService, ComentarioPublico } from '../../services/site-api.service';

@Component({
  selector: 'app-depoimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './depoimentos.html',
  styleUrl: './depoimentos.scss',
})
export class DepoimentosPage implements OnInit {
  itens: ComentarioPublico[] = [];
  loading = true;
  enviando = false;
  okMsg = '';
  erroMsg = '';
  form = { nome: '', cidade: '', instagram: '', texto: '' };
  erros: Record<string, string> = {};

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.api.getComentarios().subscribe({
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

  enviar(): void {
    if (this.enviando) return;
    this.erros = {};
    this.okMsg = '';
    this.erroMsg = '';
    const instagram = this.form.instagram.trim().replace(/^@/, '');
    if (!this.form.nome.trim()) this.erros['nome'] = 'Informe seu nome.';
    if (!instagram) this.erros['instagram'] = 'Informe seu @ do Instagram.';
    else if (!/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) this.erros['instagram'] = 'Informe um @ do Instagram válido.';
    if (!this.form.texto.trim() || this.form.texto.trim().length < 5) this.erros['texto'] = 'Escreva um comentário com pelo menos 5 caracteres.';
    if (Object.keys(this.erros).length) {
      this.erroMsg = 'Preencha os campos obrigatórios.';
      return;
    }

    this.enviando = true;
    this.api.criarComentario({
      nome: this.form.nome.trim(),
      cidade: this.form.cidade.trim() || undefined,
      instagram,
      texto: this.form.texto.trim(),
    }).subscribe({
      next: (res) => {
        this.enviando = false;
        this.okMsg = res.message || 'Comentário enviado para aprovação.';
        this.form = { nome: '', cidade: '', instagram: '', texto: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.enviando = false;
        this.erroMsg = err?.error?.message || 'Não foi possível enviar o comentário.';
        this.cdr.detectChanges();
      },
    });
  }
}
