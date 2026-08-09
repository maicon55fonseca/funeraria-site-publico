import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as QRCode from 'qrcode';
import { SiteApiService, PlanoPublico, SiteConfigPublica } from '../../services/site-api.service';

@Component({
  selector: 'app-adesao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './adesao.html',
  styleUrl: './adesao.scss',
})
export class AdesaoPage implements OnInit {
  planoId = 0;
  plano: PlanoPublico | null = null;
  config: SiteConfigPublica | null = null;
  loading = true;
  enviando = false;
  sucesso: any = null;
  erroMsg = '';
  erros: Record<string, string> = {};
  buscandoCep = false;
  cepErro = '';
  pixQrCodeUrl: string | null = null;

  form: any = {
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    data_nascimento: '',
    sexo: '',
    meio_pagamento: 'boleto',
    cartao_titular: '',
    cartao_numero: '',
    cartao_mes: '',
    cartao_ano: '',
    cartao_cvv: '',
  };

  constructor(
    private route: ActivatedRoute,
    private api: SiteApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.planoId = Number(this.route.snapshot.paramMap.get('planoId') || 0);
    this.api.getConfig().subscribe({
      next: (res) => {
        this.config = res.data;
        const meios = this.config?.meios_pagamento || ['boleto'];
        if (!meios.includes(this.form.meio_pagamento)) {
          this.form.meio_pagamento = meios[0] || 'boleto';
        }
        this.cdr.detectChanges();
      },
    });
    this.api.getPlanos().subscribe({
      next: (res) => {
        this.plano = (res.data || []).find((p) => p.id === this.planoId) || null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.erroMsg = 'Não foi possível carregar o plano.';
        this.cdr.detectChanges();
      },
    });
  }

  get meios(): string[] {
    return this.config?.meios_pagamento?.length ? this.config.meios_pagamento : ['boleto'];
  }

  labelMeio(m: string): string {
    if (m === 'pix') return 'PIX';
    if (m === 'cartao_credito') return 'Cartão de crédito';
    return 'Boleto / Carnê';
  }

  money(v: number | string | null | undefined): string {
    return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  maskCpf(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.form.cpf = v;
  }

  maskPhone(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    this.form.telefone = v;
  }

  maskCep(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    this.form.cep = v;
    this.cepErro = '';

    const digits = v.replace(/\D/g, '');
    if (digits.length === 8) {
      this.buscarCep(digits);
    }
  }

  private gerarQrCodePix(payload: string | null | undefined): void {
    this.pixQrCodeUrl = null;
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 220, margin: 1 })
      .then((url) => {
        this.pixQrCodeUrl = url;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.pixQrCodeUrl = null;
      });
  }

  private buscarCep(cepLimpo: string): void {
    this.buscandoCep = true;
    this.api.buscarCep(cepLimpo).subscribe({
      next: (res) => {
        this.buscandoCep = false;
        if (res?.erro) {
          this.cepErro = 'CEP não encontrado.';
          this.cdr.detectChanges();
          return;
        }
        this.form.endereco = res.logradouro || this.form.endereco;
        this.form.bairro = res.bairro || this.form.bairro;
        this.form.cidade = res.localidade || this.form.cidade;
        this.form.estado = res.uf || this.form.estado;
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoCep = false;
        this.cepErro = 'Não foi possível buscar o CEP. Preencha o endereço manualmente.';
        this.cdr.detectChanges();
      },
    });
  }

  maskCard(ev: Event): void {
    let v = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    this.form.cartao_numero = v;
  }

  validar(): boolean {
    this.erros = {};
    if (!this.form.nome?.trim()) this.erros['nome'] = 'Informe o nome completo.';
    if ((this.form.cpf || '').replace(/\D/g, '').length !== 11) this.erros['cpf'] = 'CPF inválido.';
    if ((this.form.telefone || '').replace(/\D/g, '').length < 10) this.erros['telefone'] = 'Telefone inválido.';
    if (!this.form.meio_pagamento) this.erros['meio_pagamento'] = 'Escolha o meio de pagamento.';
    if (this.form.meio_pagamento === 'cartao_credito') {
      if (!this.form.cartao_titular?.trim()) this.erros['cartao_titular'] = 'Informe o nome no cartão.';
      if ((this.form.cartao_numero || '').replace(/\D/g, '').length < 13) this.erros['cartao_numero'] = 'Número do cartão inválido.';
      if (!this.form.cartao_mes) this.erros['cartao_mes'] = 'Mês obrigatório.';
      if (!this.form.cartao_ano) this.erros['cartao_ano'] = 'Ano obrigatório.';
      if ((this.form.cartao_cvv || '').length < 3) this.erros['cartao_cvv'] = 'CVV inválido.';
    }
    return Object.keys(this.erros).length === 0;
  }

  enviar(): void {
    if (this.enviando) return;
    this.erroMsg = '';
    this.sucesso = null;
    if (!this.validar()) {
      this.erroMsg = 'Preencha os campos obrigatórios.';
      return;
    }
    if (!this.plano) {
      this.erroMsg = 'Plano não encontrado.';
      return;
    }

    this.enviando = true;
    const payload: Record<string, unknown> = {
      plano_funerario_id: this.plano.id,
      meio_pagamento: this.form.meio_pagamento,
      nome: this.form.nome.trim(),
      cpf: this.form.cpf,
      telefone: this.form.telefone,
      email: this.form.email || null,
      cep: this.form.cep || null,
      endereco: this.form.endereco || null,
      numero: this.form.numero || null,
      complemento: this.form.complemento || null,
      bairro: this.form.bairro || null,
      cidade: this.form.cidade || null,
      estado: this.form.estado || null,
      data_nascimento: this.form.data_nascimento || null,
      sexo: this.form.sexo || null,
    };

    if (this.form.meio_pagamento === 'cartao_credito') {
      payload['cartao_titular'] = this.form.cartao_titular;
      payload['cartao_numero'] = this.form.cartao_numero;
      payload['cartao_mes'] = this.form.cartao_mes;
      payload['cartao_ano'] = this.form.cartao_ano;
      payload['cartao_cvv'] = this.form.cartao_cvv;
    }

    this.api.criarAdesao(payload).subscribe({
      next: (res) => {
        this.enviando = false;
        this.sucesso = res.data;
        this.gerarQrCodePix(this.sucesso?.cobranca?.pix_payload);
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.enviando = false;
        const errors = err?.error?.errors;
        if (errors && typeof errors === 'object') {
          const first = Object.values(errors).flat()[0];
          this.erroMsg = String(first || 'Dados inválidos.');
        } else {
          this.erroMsg = err?.error?.message || 'Não foi possível concluir a adesão. Tente novamente.';
        }
        this.cdr.detectChanges();
      },
    });
  }
}
