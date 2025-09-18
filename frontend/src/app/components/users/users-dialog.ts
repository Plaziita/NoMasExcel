import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-users-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
  ],
  styleUrls: ['./users-dialog.css'],
  template: `
    <div class="dialog-root">
      <h2 class="mat-dialog-title">
        {{ data.mode === 'add' ? 'Crear Usuario' : 'Editar Usuario' }}
      </h2>
      <div mat-dialog-content>
        <form #form="ngForm" class="dialog-form">
          <mat-form-field appearance="outline" class="mat-field-grid">
            <mat-label>Nombre</mat-label>
            <input matInput name="name" [(ngModel)]="user.name" required />
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-field-grid">
            <mat-label>Email</mat-label>
            <input matInput name="email" [(ngModel)]="user.email" required />
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-field-grid full-span">
            <mat-label>Rol</mat-label>
            <mat-select name="rol" [(ngModel)]="user.rol">
              <mat-option value="EMPLOYEE">EMPLOYEE</mat-option>
              <mat-option value="ADMIN">ADMIN</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field
            *ngIf="data.mode === 'add'"
            appearance="outline"
            class="mat-field-grid full-span"
          >
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" name="password" [(ngModel)]="user.password" required />
          </mat-form-field>
        </form>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="save()">
          {{ data.mode === 'add' ? 'Crear' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
})
export class UsersDialog {
  user: any = {};
  constructor(
    public dialogRef: MatDialogRef<UsersDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.mode === 'edit' && data.user) {
      this.user = { ...data.user };
    }
  }
  save() {
    this.dialogRef.close(this.user);
  }
}
