import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Card } from '../../models/Card';
import { User } from '../../models/User';
import { CardService } from '../../services/cardService/card';
import { UserService } from '../../services/userService/user';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CardsDialog } from './cards-dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './cards.html',
  styleUrl: './cards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cards implements OnInit {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  cards$ = this.cardsSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private userErrorSubject = new BehaviorSubject<string | null>(null);
  userError$ = this.userErrorSubject.asObservable();

  showCardModal = false;
  editingCardId: string | null = null;
  newCard: Partial<Card & { userName?: string }> = {};
  displayedColumns = ['cardNumber', 'cardType', 'cardHolder', 'userName', 'actions'];

  constructor(
    private cardService: CardService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.refreshCards();
    this.loadUsers();
  }

  public refreshCards() {
    this.loadingSubject.next(true);
    this.cardService
      .getAllCards()
      .pipe(
        catchError(() => of([] as Card[])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((cards: Card[]) => this.cardsSubject.next(cards));
  }

  private loadUsers() {
    this.userService
      .getAllUsers()
      .pipe(
        catchError((err) => {
          this.userErrorSubject.next(
            'No se pudieron cargar los usuarios (' + (err?.status || '') + ')'
          );
          return of([] as User[]);
        })
      )
      .subscribe((users: User[]) => this.usersSubject.next(users));
  }

  getUserName(userId: string | undefined): string {
    if (!userId) return '-';
    const users = this.usersSubject.value;
    const user = users.find((u) => u.id === userId);
    if (user) return user.name;
    // if not in local list, fetch by id and add for future lookups
    this.userService
      .getUserById(userId)
      .pipe(catchError(() => of(null)))
      .subscribe((u) => {
        if (u) {
          const list = this.usersSubject.value.slice();
          list.push(u as User);
          this.usersSubject.next(list);
        }
      });
    return '-';
  }

  openAddCard() {
    const dialogRef = this.dialog.open(CardsDialog, {
      width: '520px',
      data: { mode: 'add', users: this.usersSubject.value },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.newCard = result;
      this.addCard();
    });
  }

  openEditCard(card: Card) {
    const dialogRef = this.dialog.open(CardsDialog, {
      width: '520px',
      data: { mode: 'edit', card: card, users: this.usersSubject.value },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.newCard = result;
      this.editingCardId = card.id;
      this.saveEditCard();
    });
  }

  closeCardModal() {
    // dialog handles closing
  }

  addCard() {
    const normalizedNumber = (this.newCard.cardNumber || '').replace(/[\s-]/g, '');
    const payload: any = {
      cardNumber: normalizedNumber,
      cardType: this.newCard.cardType,
      cardHolder: this.newCard.cardHolder,
      userName: this.newCard.userName || undefined,
    };
    this.cardService.addCard(payload).subscribe({
      next: () => {
        this.refreshCards();
        this.closeCardModal();
        this.snackBar.open('Tarjeta creada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err?.error?.message || err.message || 'Error al crear la tarjeta';
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  saveEditCard() {
    if (!this.editingCardId) return;
    let userName: string | undefined = undefined;
    if (this.newCard.userName) {
      userName = this.newCard.userName;
    }
    const normalizedNumber = (this.newCard.cardNumber || '').replace(/[\s-]/g, '');
    const cardData: any = {
      cardNumber: normalizedNumber,
      cardType: this.newCard.cardType,
      cardHolder: this.newCard.cardHolder,
    };
    if (userName) {
      cardData.userName = userName;
    }
    this.cardService.updateCard(this.editingCardId, cardData).subscribe({
      next: () => {
        this.refreshCards();
        this.closeCardModal();
        this.editingCardId = null;
        this.snackBar.open('Tarjeta actualizada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err?.error?.message || err.message || 'Error al editar la tarjeta';
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  deleteCard(card: Card) {
    if (!confirm('¿Seguro que deseas eliminar esta tarjeta?')) return;
    this.cardService.deleteCard(card.id).subscribe({
      next: () => {
        this.refreshCards();
        this.snackBar.open('Tarjeta eliminada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err?.error?.message || err.message || 'Error al eliminar la tarjeta';
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  trackById(_index: number, item: Card) {
    return item.id;
  }

  // import/export placeholder
  onImportExport() {
    this.snackBar.open('Funcionalidad de import/export próximamente', 'Cerrar', { duration: 2000 });
  }

  onImport() {
    this.snackBar.open('Importar próximamente', 'Cerrar', { duration: 2000 });
  }

  onExport() {
    this.snackBar.open('Exportar próximamente', 'Cerrar', { duration: 2000 });
  }
}
