import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../models/User';

export interface CardsDialogData {
  mode: 'add' | 'edit';
  card?: any;
  users: User[];
}

@Component({
  selector: 'app-cards-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './cards-dialog.html',
  styleUrl: './cards-dialog.css',
})
export class CardsDialog {
  dataModel: any = {};

  constructor(
    public dialogRef: MatDialogRef<CardsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CardsDialogData
  ) {
    if (data.mode === 'edit' && data.card) {
      this.dataModel = {
        cardNumber: data.card.cardNumber,
        cardType: data.card.cardType,
        cardHolder: data.card.cardHolder,
        userName: data.card.userName || data.users.find((u) => u.id === data.card.userId)?.name,
      };
    } else {
      this.dataModel = { cardNumber: '', cardType: '', cardHolder: '', userName: undefined };
    }
  }

  submit() {
    this.dialogRef.close(this.dataModel);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
