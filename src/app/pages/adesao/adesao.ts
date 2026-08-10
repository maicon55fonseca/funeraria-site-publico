import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  copiandoPix = false;
  pixCopiado = false;
  private pixCopiadoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly diasVencimento = [5, 10, 15, 20, 25, 30];
  readonly parentescos = [
    'Cônjuge',
    'Companheiro(a)',
    'Filho(a)',
    'Pai',
    'Mãe',
    'Pai Afetivo',
    'Mãe Afetiva',
    'Irmão(ã)',
    'Avô(ó)',
    'Neto(a)',
    'Tio(a)',
    'Sobrinho(a)',
    'Primo(a)',
    'Bisneto(a)',
    'Sogro(a)',
    'Genro',
    'Nora',
    'Cunhado(a)',
    'Padrasto',
    'Madrasta',
    'Afilhado(a)',
    'Enteado(a)',
    'Bisavô(ó)',
    'Madrinha',
    'Padrinho',
    'Amigo(a)',
    'Agregado',
    'Dependente',
    'Colaborador',
    'Ex Cônjuge',
    'Ex Titular',
    'Ex Responsável',
    'Titular',
  ];

  dependentes: {
    nome: string;
    cpf: string;
    data_nascimento: string;
    parentesco: string;
    sexo: string;
  }[] = [];

  form: any = {
    nome: '',
    cpf: '',
    rg: '',
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
    dia_vencimento: 10,
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
        const diaPadrao = Number(this.config?.dia_vencimento_padrao || 10);
        if (this.diasVencimento.includes(diaPadrao)) {
          this.form.dia_vencimento = diaPadrao;
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
    if (m === 'pix') return 'PIX automático';
    if (m === 'cartao_credito') return 'Cartão de crédito';
    return 'Boleto / Carnê';
  }

  money(v: number | string | null | undefined): string {
    return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  maskCpf(ev: Event): void {
    this.form.cpf = this.formatarCpfInput((ev.target as HTMLInputElement).value);
  }

  maskCpfDependente(ev: Event, index: number): void {
    this.dependentes[index].cpf = this.formatarCpfInput((ev.target as HTMLInputElement).value);
  }

  private formatarCpfInput(raw: string): string {
    let v = (raw || '').replace(/\D/g, '').slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  get maxDependentesIncluidos(): number {
    const q = Math.max(1, Number(this.plano?.quantidade_vidas || 1));
    return Math.max(0, q - 1);
  }

  get parentescosBase(): string[] {
    const lista = this.plano?.graus_parentesco_lista;
    if (Array.isArray(lista) && lista.length) return lista;
    return this.parentescos;
  }

  get parentescosExtras(): string[] {
    const lista = this.plano?.graus_parentesco_extras_lista;
    return Array.isArray(lista) ? lista.filter(Boolean) : [];
  }

  get permitePessoasExtras(): boolean {
    return Number(this.plano?.valor_pessoa_extra || 0) > 0 && this.parentescosExtras.length > 0;
  }

  get podeAdicionarDependente(): boolean {
    if (this.dependentes.length >= 20) return false;
    if (this.dependentes.length < this.maxDependentesIncluidos) return true;
    return this.permitePessoasExtras;
  }

  get qtdExtrasSelecionadas(): number {
    return Math.max(0, this.dependentes.length - this.maxDependentesIncluidos);
  }

  get valorAcrescimoExtras(): number {
    return this.qtdExtrasSelecionadas * Number(this.plano?.valor_pessoa_extra || 0);
  }

  parentescosParaDependente(index: number): string[] {
    if (index >= this.maxDependentesIncluidos) {
      return this.parentescosExtras.length ? this.parentescosExtras : [];
    }
    return this.parentescosBase;
  }

  adicionarDependente(): void {
    if (!this.podeAdicionarDependente) {
      this.erros = {
        ...this.erros,
        dependentes: this.permitePessoasExtras
          ? 'Limite de pessoas do plano atingido para inclusos; use parentesco extra para adicionar mais.'
          : `Este plano permite no máximo ${Math.max(1, Number(this.plano?.quantidade_vidas || 1))} pessoa(s) (incluindo o titular).`,
      };
      return;
    }
    this.dependentes.push({
      nome: '',
      cpf: '',
      data_nascimento: '',
      parentesco: '',
      sexo: '',
    });
    delete this.erros['dependentes'];
    this.cdr.detectChanges();
  }

  removerDependente(index: number): void {
    this.dependentes.splice(index, 1);
    this.cdr.detectChanges();
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

  copiarCodigoPix(): void {
    const codigo = String(this.sucesso?.cobranca?.pix_payload || '').trim();
    if (!codigo || this.copiandoPix) return;

    this.copiandoPix = true;
    this.pixCopiado = false;
    if (this.pixCopiadoTimer) {
      clearTimeout(this.pixCopiadoTimer);
      this.pixCopiadoTimer = null;
    }

    const marcarCopiado = () => {
      this.copiandoPix = false;
      this.pixCopiado = true;
      this.cdr.detectChanges();
      this.pixCopiadoTimer = setTimeout(() => {
        this.pixCopiado = false;
        this.cdr.detectChanges();
      }, 2500);
    };

    const falhou = () => {
      this.copiandoPix = false;
      this.erroMsg = 'Não foi possível copiar o código PIX. Selecione e copie manualmente.';
      this.cdr.detectChanges();
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo).then(marcarCopiado).catch(() => {
        if (this.copiarTextoFallback(codigo)) marcarCopiado();
        else falhou();
      });
      return;
    }

    if (this.copiarTextoFallback(codigo)) marcarCopiado();
    else falhou();
  }

  private copiarTextoFallback(texto: string): boolean {
    try {
      const el = document.createElement('textarea');
      el.value = texto;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }

  private gerarQrCodePix(payload: string | null | undefined): void {
    this.pixQrCodeUrl = null;
    if (!payload) return;
    import('qrcode')
      .then((QRCode) => {
        const toDataURL = (QRCode as any).toDataURL || (QRCode as any).default?.toDataURL;
        if (typeof toDataURL !== 'function') return null;
        return toDataURL(payload, { width: 220, margin: 1 });
      })
      .then((url) => {
        if (!url) return;
        this.pixQrCodeUrl = url as string;
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
    if (!this.diasVencimento.includes(Number(this.form.dia_vencimento))) {
      this.erros['dia_vencimento'] = 'Escolha o dia de vencimento.';
    }
    if (!this.form.meio_pagamento) this.erros['meio_pagamento'] = 'Escolha o meio de pagamento.';
    if (this.form.meio_pagamento === 'cartao_credito') {
      if (!this.form.cartao_titular?.trim()) this.erros['cartao_titular'] = 'Informe o nome no cartão.';
      if ((this.form.cartao_numero || '').replace(/\D/g, '').length < 13) this.erros['cartao_numero'] = 'Número do cartão inválido.';
      if (!this.form.cartao_mes) this.erros['cartao_mes'] = 'Mês obrigatório.';
      if (!this.form.cartao_ano) this.erros['cartao_ano'] = 'Ano obrigatório.';
      if ((this.form.cartao_cvv || '').length < 3) this.erros['cartao_cvv'] = 'CVV inválido.';
    }
    if (!this.podeAdicionarDependente && this.dependentes.length > this.maxDependentesIncluidos && !this.permitePessoasExtras) {
      this.erros['dependentes'] = `Este plano permite no máximo ${Math.max(1, Number(this.plano?.quantidade_vidas || 1))} pessoa(s) (incluindo o titular).`;
    }
    if (this.dependentes.length > this.maxDependentesIncluidos && !this.permitePessoasExtras) {
      this.erros['dependentes'] = `Este plano permite no máximo ${Math.max(1, Number(this.plano?.quantidade_vidas || 1))} pessoa(s) (incluindo o titular).`;
    }
    this.dependentes.forEach((d, i) => {
      if (!d.nome?.trim()) this.erros[`dep_${i}_nome`] = 'Informe o nome do dependente.';
      const cpfDigits = (d.cpf || '').replace(/\D/g, '');
      if (cpfDigits && cpfDigits.length !== 11) this.erros[`dep_${i}_cpf`] = 'CPF inválido.';
      if (!d.parentesco?.trim()) this.erros[`dep_${i}_parentesco`] = 'Informe o parentesco.';
      else {
        const permitidos = this.parentescosParaDependente(i);
        if (permitidos.length && !permitidos.includes(d.parentesco)) {
          this.erros[`dep_${i}_parentesco`] = 'Parentesco não permitido para esta vaga.';
        }
      }
    });
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
      dia_vencimento: Number(this.form.dia_vencimento),
      nome: this.form.nome.trim(),
      cpf: this.form.cpf,
      rg: (this.form.rg || '').toString().trim() || null,
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

    const deps = this.dependentes
      .filter((d) => d.nome?.trim())
      .map((d) => ({
        nome: d.nome.trim(),
        cpf: d.cpf || null,
        data_nascimento: d.data_nascimento || null,
        parentesco: d.parentesco || null,
        sexo: d.sexo || null,
      }));
    if (deps.length) {
      payload['dependentes'] = deps;
    }

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
