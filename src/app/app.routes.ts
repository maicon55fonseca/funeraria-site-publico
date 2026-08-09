import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'planos',
    loadComponent: () => import('./pages/planos/planos').then((m) => m.PlanosPage),
  },
  {
    path: 'adesao/:planoId',
    loadComponent: () => import('./pages/adesao/adesao').then((m) => m.AdesaoPage),
  },
  {
    path: 'depoimentos',
    loadComponent: () => import('./pages/depoimentos/depoimentos').then((m) => m.DepoimentosPage),
  },
  {
    path: 'parceiros/cadastro',
    loadComponent: () => import('./pages/parceiros/parceiro-cadastro').then((m) => m.ParceiroCadastroPage),
  },
  {
    path: 'parceiros',
    loadComponent: () => import('./pages/parceiros/parceiros').then((m) => m.ParceirosPage),
  },
  { path: '**', redirectTo: '' },
];
