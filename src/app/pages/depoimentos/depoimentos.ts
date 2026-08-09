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
  fotoArquivo: File | null = null;
  fotoPreviewUrl: string | null = null;

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

  onFotoSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.erros['foto'] = 'Envie uma imagem (JPG, PNG ou WEBP).';
      return;
    }

    this.redimensionarFoto(file, 480)
      .then((arquivo) => {
        this.fotoArquivo = arquivo;
        delete this.erros['foto'];
        if (this.fotoPreviewUrl) URL.revokeObjectURL(this.fotoPreviewUrl);
        this.fotoPreviewUrl = URL.createObjectURL(arquivo);
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.erros['foto'] = 'Não foi possível processar essa imagem. Tente outra.';
        this.cdr.detectChanges();
      });
  }

  removerFoto(): void {
    this.fotoArquivo = null;
    if (this.fotoPreviewUrl) URL.revokeObjectURL(this.fotoPreviewUrl);
    this.fotoPreviewUrl = null;
  }

  private redimensionarFoto(file: File, maxLado: number): Promise<File> {
    if (file.size <= 250_000) return Promise.resolve(file);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          let { width, height } = img;
          const maior = Math.max(width, height);
          if (maior > maxLado) {
            const escala = maxLado / maior;
            width = Math.round(width * escala);
            height = Math.round(height * escala);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file);
            },
            'image/jpeg',
            0.8
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  enviar(): void {
    if (this.enviando) return;
    this.erros = {};
    this.okMsg = '';
    this.erroMsg = '';
    const instagram = this.form.instagram.trim().replace(/^@/, '');
    if (!this.form.nome.trim()) this.erros['nome'] = 'Informe seu nome.';
    if (instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) this.erros['instagram'] = 'Informe um @ do Instagram válido.';
    if (!this.form.texto.trim() || this.form.texto.trim().length < 5) this.erros['texto'] = 'Escreva um comentário com pelo menos 5 caracteres.';
    if (Object.keys(this.erros).length) {
      this.erroMsg = 'Preencha os campos obrigatórios.';
      return;
    }

    this.enviando = true;
    this.api.criarComentario({
      nome: this.form.nome.trim(),
      cidade: this.form.cidade.trim() || undefined,
      instagram: instagram || undefined,
      texto: this.form.texto.trim(),
      foto: this.fotoArquivo || undefined,
    }).subscribe({
      next: (res) => {
        this.enviando = false;
        this.okMsg = res.message || 'Comentário enviado para aprovação.';
        this.form = { nome: '', cidade: '', instagram: '', texto: '' };
        this.removerFoto();
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
