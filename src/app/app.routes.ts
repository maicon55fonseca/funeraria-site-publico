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
  { path: '**', redirectTo: '' },
];
