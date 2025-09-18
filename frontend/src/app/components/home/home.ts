import { Cards } from '../cards/cards';
import { Users } from '../users/users';
import { Expenses } from '../expenses/expenses';
import { Component, OnInit } from '@angular/core';
import { Expense, ExpenseStatus } from '../../models/Expense';
import { Card } from '../../models/Card';
import { CardService } from '../../services/cardService/card';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/userService/user';
import { Observable } from 'rxjs';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgClass,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    Cards,
    Users,
    Expenses,
  ],
})
export class HomeComponent implements OnInit {
  cardLoading = false;
  popupMessage: string | null = null;
  popupType: 'success' | 'error' | 'info' = 'info';
  showPopup(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.popupMessage = message;
    this.popupType = type;
    setTimeout(() => this.closePopup(), 3500);
  }
  closePopup() {
    this.popupMessage = null;
  }

  deleteCard(card: Card) {
    if (!confirm('¿Seguro que deseas eliminar esta tarjeta?')) return;
    this.cardService.deleteCard(card.id).subscribe({
      next: () => {
        this.cards = this.cards.filter((c) => c.id !== card.id);
        this.showPopup('Tarjeta eliminada correctamente', 'success');
      },
      error: (err) => {
        this.showPopup(
          'Error al eliminar la tarjeta: ' + (err?.error?.message || err.message || err),
          'error'
        );
      },
    });
  }
  editingCardId: string | null = null;
  users: { name: string; id?: string }[] = [];
  // card management state (ADMIN)
  showCardModal = false;
  newCard: Partial<Card & { cardHolder?: string; userName?: string }> = {};
  openAddCard() {
    this.newCard = { cardNumber: '', cardType: '', cardHolder: '' };
    this.showCardModal = true;
    this.editingCardId = null;
  }
  openEditCard(card: Card) {
    this.newCard = {
      cardNumber: card.cardNumber,
      cardType: card.cardType,
      cardHolder: card.cardHolder,
      userName: this.users.find((u) => u.id === card.userId)?.name,
      id: card.id,
    };
    this.editingCardId = card.id;
    this.showCardModal = true;
  }

  closeCardModal() {
    this.showCardModal = false;
  }

  addCard() {
    // prepare payload and normalize card number (remove spaces/dashes)
    const normalizedNumber = (this.newCard.cardNumber || '').replace(/[\s-]/g, '');
    const payload: any = {
      cardNumber: normalizedNumber,
      cardType: this.newCard.cardType,
      cardHolder: this.newCard.cardHolder,
      userName: this.newCard.userName || undefined,
    };
    this.cardService.addCard(payload).subscribe({
      next: (createdCard: Card) => {
        this.cards = [createdCard, ...this.cards];
        this.closeCardModal();
      },
      error: (err) => {
        let msg = 'Error al crear la tarjeta';
        if (
          err?.error?.error &&
          (err.error.error.includes('duplicado') ||
            err.error.error.includes('No se aceptan duplicados'))
        ) {
          msg = 'No se aceptan duplicados';
        } else {
          msg = 'Error al crear la tarjeta';
        }
        this.showPopup(msg, 'error');
      },
    });
  }
  selectedSection: string = 'expenses';
  expenses: Expense[] = [];
  cards: Card[] = [];
  user$: Observable<any>;
  newExpense: Partial<Expense> = {};
  pdfFile: File | null = null;
  showExpenseModal = false;

  // --- selection and status buckets ---
  pendingExpenses: Expense[] = [];
  approvedExpenses: Expense[] = [];
  rejectedExpenses: Expense[] = [];
  selectedPending: string[] = [];
  selectedApproved: string[] = [];
  selectedRejected: string[] = [];

  resumen = {
    totalGastado: 30,
    numTransacciones: 2,
    promedioDia: 15,
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private cardService: CardService
  ) {
    this.user$ = this.userService.checkSession();
  }

  saveEditCard() {
    if (!this.editingCardId) return;
    // Find userId by userName
    let userId = '';
    if (this.newCard.userName) {
      const user = this.users.find((u) => u.name === this.newCard.userName);
      if (user) userId = user.id || '';
    }
    // Normalizar número de tarjeta (eliminar espacios y guiones)
    const normalizedNumber = (this.newCard.cardNumber || '').replace(/[\s-]/g, '');
    const cardData = {
      cardNumber: normalizedNumber,
      cardType: this.newCard.cardType,
      cardHolder: this.newCard.cardHolder,
      userId: userId,
    };
    this.cardService.updateCard(this.editingCardId, cardData).subscribe({
      next: (updatedCard: Card) => {
        const idx = this.cards.findIndex((c) => c.id === this.editingCardId);
        if (idx > -1) this.cards[idx] = updatedCard;
        this.closeCardModal();
        this.editingCardId = null;
        this.showPopup('Tarjeta editada correctamente!', 'success');
      },
      error: (err) => {
        let msg = 'Error al editar la tarjeta';
        if (
          err?.error?.error &&
          (err.error.error.includes('duplicado') ||
            err.error.error.includes('No se aceptan duplicados'))
        ) {
          msg = 'No se aceptan duplicados';
        }
        // do not close modal on error
        this.showPopup(msg, 'error');
      },
    });
  }

  ngOnInit() {
    this.splitExpensesByStatus();
    // load cards from backend
    this.cardService.getAllCards().subscribe({
      next: (cards) => {
        this.cards = cards;
      },
      error: (err) => {
        let msg = 'Error al cargar tarjetas';
        if (err?.error?.message) {
          msg += ': ' + err.error.message;
        } else if (err.message) {
          msg += ': ' + err.message;
        }
        this.showPopup(msg, 'error');
      },
    });
    // load users for card select
    this.userService.getAllUsers().subscribe((users) => {
      this.users = users;
    });
  }

  addExpense() {
    if (this.newExpense.id) {
      // Edición solo permite cambiar estado si es ADMIN
      const idx = this.expenses.findIndex((e) => e.id === this.newExpense.id);
      if (idx > -1) {
        // Solo ADMIN puede cambiar el estado
        const user = (this.user$ as any)?.source?._value || {};
        const isAdmin = user.rol === 'ADMIN';
        this.expenses[idx] = {
          ...this.expenses[idx],
          ...this.newExpense,
          status: isAdmin ? (this.newExpense.status as ExpenseStatus) : this.expenses[idx].status,
        };
      }
      this.splitExpensesByStatus();
      this.closeExpenseModal();
      return;
    }
    // Alta nueva: siempre pendiente
    const newId = (Math.random() * 100000).toFixed(0);
    const expense: Expense = {
      id: newId,
      cardId: this.newExpense.cardId!,
      date: this.newExpense.date!,
      amount: this.newExpense.amount!,
      category: this.newExpense.category!,
      description: this.newExpense.description,
      status: 'pendiente',
      pdfUrl: this.newExpense.pdfUrl,
    };
    this.expenses = [expense, ...this.expenses];
    this.splitExpensesByStatus();
    this.closeExpenseModal();
  }

  // ---------------- utilities ----------------
  getEmptyExpense(): Partial<Expense> {
    return {
      cardId: '',
      date: '',
      amount: 0,
      category: '',
      description: '',
      status: 'pendiente',
      pdfUrl: '',
    };
  }

  openAddExpense() {
    this.newExpense = this.getEmptyExpense();
    this.pdfFile = null;
    this.showExpenseModal = true;
  }

  closeExpenseModal() {
    this.showExpenseModal = false;
  }

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.pdfFile = file;
      // En real deberías subir el archivo y guardar la URL
      this.newExpense.pdfUrl = file.name;
    }
  }

  // ---------------- split expenses ----------------
  splitExpensesByStatus() {
    this.pendingExpenses = this.expenses.filter((e) => e.status === 'pendiente');
    this.approvedExpenses = this.expenses.filter((e) => e.status === 'aprobado');
    this.rejectedExpenses = this.expenses.filter((e) => e.status === 'rechazado');
  }

  // ---------------- selection ----------------
  toggleSelect(tabla: string, id: string, event: any) {
    const checked = event.target.checked;
    const arr = this.getSelectedArray(tabla);
    if (checked) {
      if (!arr.includes(id)) arr.push(id);
    } else {
      const idx = arr.indexOf(id);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  toggleAll(tabla: string, event: any) {
    const checked = event.target.checked;
    const arr = this.getSelectedArray(tabla);
    const list = this.getExpenseArray(tabla);
    if (checked) {
      arr.length = 0;
      arr.push(...list.map((e) => e.id));
    } else {
      arr.length = 0;
    }
  }

  allPendingSelected() {
    return (
      this.selectedPending.length === this.pendingExpenses.length && this.pendingExpenses.length > 0
    );
  }
  allApprovedSelected() {
    return (
      this.selectedApproved.length === this.approvedExpenses.length &&
      this.approvedExpenses.length > 0
    );
  }
  allRejectedSelected() {
    return (
      this.selectedRejected.length === this.rejectedExpenses.length &&
      this.rejectedExpenses.length > 0
    );
  }

  getSelectedArray(tabla: string): string[] {
    if (tabla === 'pendiente') return this.selectedPending;
    if (tabla === 'aprobado') return this.selectedApproved;
    if (tabla === 'rechazado') return this.selectedRejected;
    return [];
  }

  getExpenseArray(tabla: string): Expense[] {
    if (tabla === 'pendiente') return this.pendingExpenses;
    if (tabla === 'aprobado') return this.approvedExpenses;
    if (tabla === 'rechazado') return this.rejectedExpenses;
    return [];
  }

  // ---------------- expenses CRUD ----------------
  deleteSelected(tabla: string) {
    const arr = this.getSelectedArray(tabla);
    if (!arr.length) return;
    if (!confirm('¿Seguro que deseas eliminar los gastos seleccionados?')) return;
    this.expenses = this.expenses.filter((e) => !arr.includes(e.id));
    this.splitExpensesByStatus();
    arr.length = 0;
  }

  editSelected(tabla: string) {
    const arr = this.getSelectedArray(tabla);
    if (arr.length !== 1) return;
    const id = arr[0];
    const gasto = this.expenses.find((e) => e.id === id);
    if (!gasto) return;
    this.newExpense = { ...gasto };
    this.showExpenseModal = true;
  }

  // (implementación duplicada de addExpense eliminada)

  // ---------------- session ----------------
}
