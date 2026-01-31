import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  }
  , {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/home/home').then((m) => m.Home),
      },
      {
        path: 'home',
        loadComponent: () => import('./dashboard/home/home').then((m) => m.Home),
      },
      {
        path: 'residents',
        loadComponent: () => import('./dashboard/residents/residents').then((m) => m.Residents),
      },
      {
        path: 'houses',
        loadComponent: () => import('./dashboard/houses/houses').then((m) => m.Houses),
      },
      {
        path: 'payments',
        loadComponent: () => import('./dashboard/payments/payments').then((m) => m.Payments),
      },
      {
        path: 'incidents',
        loadComponent: () => import('./dashboard/incidents/incidents').then((m) => m.Incidents),
      },
      {
        path: 'settings',
        loadComponent: () => import('./dashboard/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'incident-details/:id',
        loadComponent: () => import('./dashboard/incident-details/incident-details').then((m) => m.IncidentDetails),
      },
      {
        path: 'add-incident',
        loadComponent: () => import('./dashboard/add-incident/add-incident').then((m) => m.AddIncident),
      },
      {
        path: 'add-payment',
        loadComponent: () => import('./dashboard/add-payment/add-payment').then((m) => m.AddPayment),
      },
      {
        path: 'house-details/:id',
        loadComponent: () => import('./dashboard/house-details/house-details').then((m) => m.HouseDetails),
      },
      {
        path: 'resident-details/:id',
        loadComponent: () => import('./dashboard/resident-details/resident-details').then((m) => m.ResidentDetails),
      },
      {
        path: 'add-house',
        loadComponent: () => import('./dashboard/add-house/add-house').then((m) => m.AddHouse),
      },
      {
        path: 'posts',
        loadComponent: () => import('./dashboard/posts/posts').then((m) => m.Posts),
      },
      {
        path: 'depenses',
        loadComponent: () => import('./dashboard/depenses/depenses').then((m) => m.Depenses),
      }
    ]
  }
  , {
    path: 'residents/add',
    loadComponent: () => import('./add-resident/add-resident').then((m) => m.AddResident),
  },
  {
    path: 'residents/add/:id',
    loadComponent: () => import('./add-resident/add-resident').then((m) => m.AddResident),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },

];
