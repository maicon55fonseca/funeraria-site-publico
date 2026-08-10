import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const VIA_CEP_URL = 'https://viacep.com.br/ws';

export interface SiteConfigPublica {
  dominio?: string | null;
  titulo_hero?: string | null;
  subtitulo_hero?: string | null;
  texto_sobre?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  email_contato?: string | null;
  url_instagram?: string | null;
  url_facebook?: string | null;
  url_youtube?: string | null;
  url_tiktok?: string | null;
  url_mapa?: string | null;
  url_logo?: string | null;
  url_banner?: string | null;
  banners?: { id: number; url_imagem: string; ordem?: number }[];
  cor_primaria?: string | null;
  cor_rodape?: string | null;
  cor_fonte_rodape?: string | null;
  meios_pagamento?: string[];
  quantidade_parcelas?: number;
  dia_vencimento_padrao?: number;
}

export interface PlanoItemPublico {
  id: number;
  nome: string;
  preco?: number | string | null;
  valor?: number | string | null;
}

export interface PlanoPublico {
  id: number;
  nome: string;
  descricao?: string | null;
  valor_mensal: number | string;
  valor_adesao?: number | string | null;
  carencia_dias?: number | null;
  quantidade_vidas?: number | null;
  graus_parentesco?: string | null;
  graus_parentesco_lista?: string[] | null;
  valor_pessoa_extra?: number | string | null;
  graus_parentesco_extras?: string | null;
  graus_parentesco_extras_lista?: string[] | null;
  coberturas?: string | null;
  produtos?: PlanoItemPublico[];
  servicos?: PlanoItemPublico[];
}

export interface ComentarioPublico {
  id: number;
  nome: string;
  cidade?: string | null;
  instagram?: string | null;
  instagram_url?: string | null;
  foto_url?: string | null;
  texto: string;
  aprovado_em?: string | null;
}

export interface ParceiroPublico {
  id: number;
  nome: string;
  segmento: string;
  cidade: string;
  estado: string;
  bairro?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  beneficio: string;
  url_logo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteApiService {
  private base = `${environment.apiUrl}/public/site`;
  private config$?: Observable<{ data: SiteConfigPublica }>;

  constructor(private http: HttpClient) {}

  /** Hostname do browser, ou NG_APP_SITE_DOMINIO (app-config) se definido. */
  dominioAtual(): string {
    const canonico = (environment.dominioSite || '').trim();
    if (canonico) return canonico.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return typeof window !== 'undefined' ? window.location.hostname : '';
  }

  private dominioParams(): HttpParams {
    const host = this.dominioAtual();
    return host ? new HttpParams().set('dominio', host) : new HttpParams();
  }

  getConfig(): Observable<{ data: SiteConfigPublica }> {
    if (!this.config$) {
      this.config$ = this.http
        .get<{ data: SiteConfigPublica }>(`${this.base}/config`, {
          params: this.dominioParams(),
        })
        .pipe(shareReplay(1));
    }
    return this.config$;
  }

  getPlanos(): Observable<{ data: PlanoPublico[] }> {
    return this.http.get<{ data: PlanoPublico[] }>(`${this.base}/planos`, {
      params: this.dominioParams(),
    });
  }

  criarAdesao(payload: Record<string, unknown>): Observable<{ message: string; data: any }> {
    const body = { ...payload, dominio: this.dominioAtual() || undefined };
    return this.http.post<{ message: string; data: any }>(`${this.base}/adesoes`, body);
  }

  getComentarios(): Observable<{ data: ComentarioPublico[] }> {
    return this.http.get<{ data: ComentarioPublico[] }>(`${this.base}/comentarios`, {
      params: this.dominioParams(),
    });
  }

  buscarCep(cep: string): Observable<EnderecoViaCEP> {
    const cepLimpo = (cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return new Observable((observer) => {
        observer.error({ erro: true, mensagem: 'CEP deve conter 8 dígitos' });
        observer.complete();
      });
    }

    return this.http.get<EnderecoViaCEP>(`${this.base}/cep/${cepLimpo}`).pipe(
      catchError(() => this.http.get<EnderecoViaCEP>(`${VIA_CEP_URL}/${cepLimpo}/json/`))
    );
  }

  getParceiros(filtros: { cidade?: string; estado?: string; segmento?: string } = {}): Observable<{ data: ParceiroPublico[] }> {
    let params = this.dominioParams();
    if (filtros.cidade) params = params.set('cidade', filtros.cidade);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.segmento) params = params.set('segmento', filtros.segmento);
    return this.http.get<{ data: ParceiroPublico[] }>(`${this.base}/parceiros`, { params });
  }

  criarParceiro(payload: Record<string, unknown>): Observable<{ message: string; data?: { id: number } }> {
    const body = { ...payload, dominio: this.dominioAtual() || undefined };
    return this.http.post<{ message: string; data?: { id: number } }>(`${this.base}/parceiros`, body);
  }

  criarComentario(payload: { nome: string; cidade?: string; instagram?: string; texto: string; foto?: File }): Observable<{ message: string }> {
    const form = new FormData();
    form.append('nome', payload.nome);
    if (payload.cidade) form.append('cidade', payload.cidade);
    if (payload.instagram) form.append('instagram', payload.instagram);
    form.append('texto', payload.texto);
    if (payload.foto) form.append('foto', payload.foto);
    const dominio = this.dominioAtual();
    if (dominio) form.append('dominio', dominio);
    return this.http.post<{ message: string }>(`${this.base}/comentarios`, form);
  }
}
