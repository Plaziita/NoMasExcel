import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Card } from '../../models/Card';

export interface ExpensesDialogData {
  mode: 'add' | 'edit';
  expense?: any;
  cards: Card[];
  isAdmin: boolean;
}

@Component({
  selector: 'app-expenses-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
  ],
  templateUrl: './expenses-dialog.html',
  styleUrls: ['./expenses-dialog.css'],
})
export class ExpensesDialog {
  dataModel: any = {};

  constructor(
    public dialogRef: MatDialogRef<ExpensesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ExpensesDialogData
  ) {
    if (data.mode === 'edit' && data.expense) {
      this.dataModel = {
        id: data.expense.id,
        cardId: data.expense.cardId,
        date: data.expense.date,
        amount: data.expense.amount,
        category: data.expense.category,
        description: data.expense.description,
        status: data.expense.status,
        pdfUrl: data.expense.pdfUrl,
      };
    } else {
      this.dataModel = {
        cardId: '',
        date: '',
        amount: 0,
        category: '',
        description: '',
        status: 'pendiente',
        pdfUrl: '',
      };
    }
  }

  submit() {
    this.dialogRef.close(this.dataModel);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
