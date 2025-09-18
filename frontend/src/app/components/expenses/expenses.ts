import { Component, OnInit } from '@angular/core';
import { Expense, ExpenseStatus } from '../../models/Expense';
import { Card } from '../../models/Card';
import { CardService } from '../../services/cardService/card';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class Expenses implements OnInit {
  expenses: Expense[] = [];
  cards: Card[] = [];
  newExpense: Partial<Expense> = {};
  pdfFile: File | null = null;
  showExpenseModal = false;
  pendingExpenses: Expense[] = [];
  approvedExpenses: Expense[] = [];
  rejectedExpenses: Expense[] = [];
  selectedPending: string[] = [];
  selectedApproved: string[] = [];
  selectedRejected: string[] = [];
  isAdmin = true; // TODO: replace with real role logic when user is provided as input

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.cardService.getAllCards().subscribe((cards) => (this.cards = cards));
    // TODO: load real expenses from a service if available
    this.splitExpensesByStatus();
  }

  addExpense() {
    if (this.newExpense.id) {
      const idx = this.expenses.findIndex((e) => e.id === this.newExpense.id);
      if (idx > -1) {
        const isAdmin = this.isAdmin;
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
      this.newExpense.pdfUrl = file.name;
    }
  }

  splitExpensesByStatus() {
    this.pendingExpenses = this.expenses.filter((e) => e.status === 'pendiente');
    this.approvedExpenses = this.expenses.filter((e) => e.status === 'aprobado');
    this.rejectedExpenses = this.expenses.filter((e) => e.status === 'rechazado');
  }

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
}
