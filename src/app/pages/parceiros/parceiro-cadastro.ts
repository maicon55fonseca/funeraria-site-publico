import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteApiService } from '../../services/site-api.service';

@Component({
  selector: 'app-parceiro-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './parceiro-cadastro.html',
  styleUrl: './parceiro-cadastro.scss',
})
export class ParceiroCadastroPage {
  enviando = false;
  sucesso = false;
  erroMsg = '';
  erros: Record<string, string> = {};

  form = {
    nome: '',
    segmento: '',
    cidade: '',
    estado: '',
    bairro: '',
    endereco: '',
    telefone: '',
    email: '',
    cnpj: '',
    beneficio: '',
    url_logo: '',
  };

  constructor(
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  maskPhone(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    this.form.telefone = v;
  }

  maskCnpj(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    this.form.cnpj = v;
  }

  onLogoSelecionada(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.erroMsg = 'Envie uma imagem válida para a logo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.form.url_logo = String(reader.result || '');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  validar(): boolean {
    this.erros = {};
    if (!this.form.nome.trim()) this.erros['nome'] = 'Informe o nome do estabelecimento.';
    if (!this.form.segmento.trim()) this.erros['segmento'] = 'Informe o segmento.';
    if (!this.form.cidade.trim()) this.erros['cidade'] = 'Informe a cidade.';
    if (this.form.estado.trim().length !== 2) this.erros['estado'] = 'UF inválida.';
    if ((this.form.telefone || '').replace(/\D/g, '').length < 10) this.erros['telefone'] = 'Telefone inválido.';
    if (!this.form.beneficio.trim() || this.form.beneficio.trim().length < 5) {
      this.erros['beneficio'] = 'Descreva o benefício oferecido.';
    }
    return Object.keys(this.erros).length === 0;
  }

  enviar(): void {
    if (this.enviando) return;
    this.erroMsg = '';
    this.sucesso = false;
    if (!this.validar()) {
      this.erroMsg = 'Preencha os campos obrigatórios.';
      return;
    }

    this.enviando = true;
    this.api
      .criarParceiro({
        nome: this.form.nome.trim(),
        segmento: this.form.segmento.trim(),
        cidade: this.form.cidade.trim(),
        estado: this.form.estado.trim().toUpperCase(),
        bairro: this.form.bairro.trim() || null,
        endereco: this.form.endereco.trim() || null,
        telefone: this.form.telefone,
        email: this.form.email.trim() || null,
        cnpj: this.form.cnpj || null,
        beneficio: this.form.beneficio.trim(),
        url_logo: this.form.url_logo || null,
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.sucesso = true;
          this.cdr.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          this.enviando = false;
          const first = Object.values(err?.error?.errors || {}).flat()[0];
          this.erroMsg = String(first || err?.error?.message || 'Não foi possível enviar o cadastro.');
          this.cdr.detectChanges();
        },
      });
  }
}
