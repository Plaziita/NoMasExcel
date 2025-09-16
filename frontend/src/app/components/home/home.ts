import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/userService/user';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { NgFor, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    NgFor,
    NgIf,
    NgClass,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  selectedSection: 'user' | 'expenses' | 'summary' = 'user';

  user$: Observable<any>;
  expenses = [
    { fecha: '2025-09-17', categoria: 'Comida', monto: 20, descripcion: 'Almuerzo' },
    { fecha: '2025-09-16', categoria: 'Transporte', monto: 10, descripcion: 'Bus' },
  ];
  resumen = {
    totalGastado: 30,
    numTransacciones: 2,
    promedioDia: 15,
  };

  constructor(private userService: UserService, private router: Router) {
    this.user$ = this.userService.checkSession();
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => {
        this.router.navigate(['']);
      },
      error: () => {
        this.router.navigate(['']);
      },
    });
  }
}
