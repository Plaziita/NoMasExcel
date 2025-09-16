import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Home } from './components/home/home';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: Home },
];
