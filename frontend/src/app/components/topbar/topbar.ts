import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../services/userService/user';
import { Subscription } from 'rxjs';
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
  name: string = '';
  private userSub?: Subscription;
  timeString: string = '';
  private timerId: any;
  isDark = false;

  private logoutSub?: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 1000);
    this.userSub = this.userService.checkSession().subscribe((u: any) => {
      this.name = u?.name || '';
    });
    // initialize theme from localStorage
    try {
      const stored = localStorage.getItem('nomasexcel-theme');
      this.isDark = stored === 'dark';
      this.applyTheme();
    } catch (e) {}
  }

  updateTime() {
    const now = new Date();
    this.timeString = now.toLocaleString();
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
    this.cdr.detectChanges?.();
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
    if (this.timerId) clearInterval(this.timerId);
    if (this.userSub) this.userSub.unsubscribe();
    if (this.logoutSub) this.logoutSub.unsubscribe();
  }
}
