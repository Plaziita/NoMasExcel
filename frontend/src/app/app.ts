import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Topbar } from './components/topbar/topbar';
import { Footer } from './components/footer/footer';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgIf, RouterOutlet, Topbar, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('frontend');
  constructor(private router: Router) {}

  get showShell(): boolean {
    const url = this.router.url || '/';
    return url !== '/';
  }
}
