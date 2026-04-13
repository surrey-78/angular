import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { FinanceComponent } from './components/finance/finance';

export const routes: Routes = [
    { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'finance', component: FinanceComponent }
];
