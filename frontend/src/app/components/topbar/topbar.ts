import { Component, OnDestroy } from '@angular/core';
import { UserService } from '../../services/userService/user';
import { Subscription, Observable, interval, map, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css'],
})
export class Topbar implements OnDestroy {
  // expose the session observable and bind with async pipe in the template
  user$: Observable<any> | null = null;
  time$: Observable<string>;
  isDark = false;

  private logoutSub?: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.time$ = interval(1000).pipe(
      startWith(0),
      map(() => new Date().toLocaleString())
    );
    // initialize the session observable after services are available
    this.user$ = this.userService.checkSession();
    // initialize theme from localStorage
    try {
      const stored = localStorage.getItem('nomasexcel-theme');
      this.isDark = stored === 'dark';
      this.applyTheme();
    } catch (e) {}
  }

  onLogout() {
    if (this.logoutSub) {
      this.logoutSub.unsubscribe();
    }
    this.logoutSub = this.userService.logout().subscribe({
      next: () => {
        this.snack.open('Sesión cerrada', undefined, { duration: 1500 });
        this.router.navigate(['']);
      },
      error: () => {
        this.snack.open('Error cerrando sesión', undefined, { duration: 2000 });
        this.router.navigate(['']);
      },
    });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    try {
      localStorage.setItem('nomasexcel-theme', this.isDark ? 'dark' : 'light');
    } catch (e) {}
    this.applyTheme();
    // no manual detectChanges needed
  }

  private applyTheme() {
    const root = document.documentElement;
    if (this.isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }

  ngOnDestroy() {
    // timerId cleanup not needed
    if (this.logoutSub) this.logoutSub.unsubscribe();
  }
}
