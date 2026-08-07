import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  coberturas?: string | null;
  produtos?: PlanoItemPublico[];
  servicos?: PlanoItemPublico[];
}

export interface ComentarioPublico {
  id: number;
  nome: string;
  cidade?: string | null;
  texto: string;
  aprovado_em?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteApiService {
  private base = `${environment.apiUrl}/public/site`;

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
    return this.http.get<{ data: SiteConfigPublica }>(`${this.base}/config`, {
      params: this.dominioParams(),
    });
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

  criarComentario(payload: { nome: string; cidade?: string; texto: string }): Observable<{ message: string }> {
    const body = { ...payload, dominio: this.dominioAtual() || undefined };
    return this.http.post<{ message: string }>(`${this.base}/comentarios`, body);
  }
}
