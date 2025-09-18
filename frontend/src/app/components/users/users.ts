import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../models/User';
import { UserService } from '../../services/userService/user';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UsersDialog } from './users-dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  displayedColumns = ['name', 'email', 'rol', 'actions'];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.refreshUsers();
  }

  refreshUsers() {
    this.loadingSubject.next(true);
    this.userService
      .getAllUsers()
      .pipe(
        catchError(() => of([] as User[])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((users: User[]) => this.usersSubject.next(users));
  }

  openAddUser() {
    const ref = this.dialog.open(UsersDialog, { width: '520px', data: { mode: 'add' } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.userService.register(result).subscribe({
        next: () => {
          this.refreshUsers();
          this.snackBar.open('Usuario creado', 'Cerrar', { duration: 3000 });
        },
        error: (err: any) =>
          this.snackBar.open(err?.error?.message || 'Error creando usuario', 'Cerrar', {
            duration: 4000,
          }),
      });
    });
  }

  openEditUser(user: User) {
    const ref = this.dialog.open(UsersDialog, { width: '520px', data: { mode: 'edit', user } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const id = user.id || '';
      this.userService.updateUser(id, result).subscribe({
        next: () => {
          this.refreshUsers();
          this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
        },
        error: (err: any) =>
          this.snackBar.open(err?.error?.message || 'Error actualizando usuario', 'Cerrar', {
            duration: 4000,
          }),
      });
    });
  }

  deleteUser(user: User) {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    const id = user.id || '';
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.refreshUsers();
        this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
      },
      error: (err: any) =>
        this.snackBar.open(err?.error?.message || 'Error eliminando usuario', 'Cerrar', {
          duration: 4000,
        }),
    });
  }

  trackById(_i: number, u: User) {
    return u.id;
  }
}
