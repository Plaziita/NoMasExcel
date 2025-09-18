import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Expense, ExpenseStatus } from '../../models/Expense';
import { Card } from '../../models/Card';
import { CardService } from '../../services/cardService/card';
import { ExpenseService } from '../../services/expenseService/expense';
import { UserService } from '../../services/userService/user';
import { Observable, forkJoin, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesDialog } from './expenses-dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class Expenses implements OnInit, AfterViewInit, OnDestroy {
  expenses: Expense[] = [];
  cards: Card[] = [];
  newExpense: Partial<Expense> = {};
  pdfFile: File | null = null;
  showExpenseModal = false;
  pendingExpenses: Expense[] = [];
  approvedExpenses: Expense[] = [];
  rejectedExpenses: Expense[] = [];
  // Material data sources for tables
  pendingDataSource = new MatTableDataSource<Expense>([]);
  approvedDataSource = new MatTableDataSource<Expense>([]);
  rejectedDataSource = new MatTableDataSource<Expense>([]);
  selectedPending: string[] = [];
  selectedApproved: string[] = [];
  selectedRejected: string[] = [];
  isAdmin = false; // will be determined from session
  user$: Observable<any> | null = null;
  currentUserId: string | null = null;
  private userSub?: Subscription;
  // columns for mat-table (separate arrays per tab to avoid duplicate matColumnDef names in the same template)
  displayedColumnsPending = [
    'select',
    'date',
    'userName',
    'category',
    'amount',
    'description',
    'actions',
  ];
  displayedColumnsApproved = [
    'select',
    'date',
    'userNameApproved',
    'category',
    'amount',
    'description',
    'actions',
  ];
  displayedColumnsRejected = [
    'select',
    'date',
    'userNameRejected',
    'category',
    'amount',
    'description',
    'actions',
  ];
  // pagination-like controls per table (visible rows)
  pageSizeOptions = [5, 10, 20];
  pageSizePending = 5;
  pageSizeApproved = 5;
  pageSizeRejected = 5;

  // Paginators & sorts for each table
  @ViewChild('paginatorPending') paginatorPending?: MatPaginator;
  @ViewChild('sortPending') sortPending?: MatSort;
  @ViewChild('paginatorApproved') paginatorApproved?: MatPaginator;
  @ViewChild('sortApproved') sortApproved?: MatSort;
  @ViewChild('paginatorRejected') paginatorRejected?: MatPaginator;
  @ViewChild('sortRejected') sortRejected?: MatSort;

  // helper to compute max-height style for scroll container
  computeMaxHeight(pageSize: number) {
    const rowHeight = 48; // approximate row height in px
    const headerHeight = 56; // header + padding
    const actionsHeight = 48; // controls height
    return headerHeight + rowHeight * Math.min(pageSize, 5) + actionsHeight;
  }

  constructor(
    private cardService: CardService,
    private userService: UserService,
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cardService.getAllCards().subscribe((cards) => (this.cards = cards));
    // determine role from session
    this.user$ = this.userService.checkSession();
    this.userSub = this.user$.subscribe((u) => {
      // defer to next tick so Angular's initial change detection pass doesn't
      // observe a mid-pass change (avoids NG0100 errors where *ngIf flips)
      setTimeout(() => {
        const isAdmin = u?.rol === 'ADMIN';
        this.isAdmin = !!isAdmin;
        this.currentUserId = u?.id || null;
      });
    });

    // load expenses from backend
    this.loadAllExpenses();
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
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
    const payloadData = { ...(this.newExpense as any) };
    // convert Date or datetime string to date-only YYYY-MM-DD
    const formatDateOnly = (d: any) => {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toISOString().slice(0, 10);
    };
    if (payloadData.date) payloadData.date = this.formatDateOnly(payloadData.date);
    const payload: any = { data: payloadData };
    // Ensure status defaults to pendiente on backend if missing
    this.expenseService.create(payload as any).subscribe({
      next: (created) => {
        this.snackBar.open('Gasto creado', 'Cerrar', { duration: 3000 });
        this.loadAllExpenses();
        this.closeExpenseModal();
      },
      error: (err) => {
        this.snackBar.open('Error al crear gasto: ' + (err?.message || ''), 'Cerrar', {
          duration: 4000,
        });
      },
    });
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

  private formatDateOnly(d: any) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toISOString().slice(0, 10);
  }

  openAddExpense() {
    const dialogRef = this.dialog.open(ExpensesDialog, {
      width: '720px',
      data: { mode: 'add', cards: this.cards, isAdmin: this.isAdmin },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const res: any = { ...(result as any) };
      if (res.date) res.date = this.formatDateOnly(res.date);
      const payload: any = { data: res };
      this.expenseService.create(payload as any).subscribe({
        next: () => {
          this.snackBar.open('Gasto creado', 'Cerrar', { duration: 3000 });
          this.loadAllExpenses();
        },
        error: (err) =>
          this.snackBar.open('Error al crear gasto: ' + (err?.message || ''), 'Cerrar', {
            duration: 4000,
          }),
      });
    });
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

    // update data sources
    // Update data sources and attach paginator/sort on the next tick to avoid
    // ExpressionChangedAfterItHasBeenCheckedError when Angular checks bindings.
    setTimeout(() => {
      this.pendingDataSource.data = this.pendingExpenses;
      this.approvedDataSource.data = this.approvedExpenses;
      this.rejectedDataSource.data = this.rejectedExpenses;

      if (this.paginatorPending)
        this.pendingDataSource.paginator = this.paginatorPending as MatPaginator;
      if (this.sortPending) this.pendingDataSource.sort = this.sortPending as MatSort;
      if (this.paginatorApproved)
        this.approvedDataSource.paginator = this.paginatorApproved as MatPaginator;
      if (this.sortApproved) this.approvedDataSource.sort = this.sortApproved as MatSort;
      if (this.paginatorRejected)
        this.rejectedDataSource.paginator = this.paginatorRejected as MatPaginator;
      if (this.sortRejected) this.rejectedDataSource.sort = this.sortRejected as MatSort;
      // detect changes after updating data/paginators to stabilize view
      try {
        this.cdr.detectChanges();
      } catch (e) {}
    });
  }

  ngAfterViewInit() {
    // wire paginators and sorts on next tick to avoid changing bindings during
    // the initial change detection pass.
    setTimeout(() => {
      if (this.paginatorPending)
        this.pendingDataSource.paginator = this.paginatorPending as MatPaginator;
      if (this.sortPending) this.pendingDataSource.sort = this.sortPending as MatSort;
      if (this.paginatorApproved)
        this.approvedDataSource.paginator = this.paginatorApproved as MatPaginator;
      if (this.sortApproved) this.approvedDataSource.sort = this.sortApproved as MatSort;
      if (this.paginatorRejected)
        this.rejectedDataSource.paginator = this.paginatorRejected as MatPaginator;
      if (this.sortRejected) this.rejectedDataSource.sort = this.sortRejected as MatSort;
      try {
        this.cdr.detectChanges();
      } catch (e) {}
    });
  }

  onTabChange(index: number) {
    // re-attach paginators/sorts when tabs change because some tab contents are rendered lazily
    this.attachPaginators();
  }

  private attachPaginators() {
    if (this.paginatorPending)
      this.pendingDataSource.paginator = this.paginatorPending as MatPaginator;
    if (this.sortPending) this.pendingDataSource.sort = this.sortPending as MatSort;
    if (this.paginatorApproved)
      this.approvedDataSource.paginator = this.paginatorApproved as MatPaginator;
    if (this.sortApproved) this.approvedDataSource.sort = this.sortApproved as MatSort;
    if (this.paginatorRejected)
      this.rejectedDataSource.paginator = this.paginatorRejected as MatPaginator;
    if (this.sortRejected) this.rejectedDataSource.sort = this.sortRejected as MatSort;
  }

  onPageEvent(event: PageEvent, tabla: string) {
    const newSize = event.pageSize;
    if (tabla === 'pendiente') this.pageSizePending = newSize;
    if (tabla === 'aprobado') this.pageSizeApproved = newSize;
    if (tabla === 'rechazado') this.pageSizeRejected = newSize;
  }

  toggleSelect(tabla: string, id: string, event: any) {
    // event may come from native input or MatCheckboxChange
    const checked = event?.checked ?? event?.target?.checked ?? false;
    const arr = this.getSelectedArray(tabla);
    if (checked) {
      if (!arr.includes(id)) arr.push(id);
    } else {
      const idx = arr.indexOf(id);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  toggleAll(tabla: string, event: any) {
    const checked = event?.checked ?? event?.target?.checked ?? false;
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
    // call backend to delete each
    const calls = arr.map((id) => this.expenseService.delete(id));
    forkJoin(calls).subscribe({
      next: () => {
        this.snackBar.open('Gastos eliminados', 'Cerrar', { duration: 3000 });
        this.loadAllExpenses();
      },
      error: (err) => {
        this.snackBar.open('Error al eliminar: ' + (err?.message || ''), 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }

  editSelected(tabla: string) {
    const arr = this.getSelectedArray(tabla);
    if (arr.length !== 1) return;
    const id = arr[0];
    const gasto = this.expenses.find((e) => e.id === id);
    if (!gasto) return;
    const dialogRef = this.dialog.open(ExpensesDialog, {
      width: '720px',
      data: { mode: 'edit', expense: gasto, cards: this.cards, isAdmin: this.isAdmin },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const res: any = { ...(result as any) };
      if (res.date) res.date = this.formatDateOnly(res.date);
      const payload: any = { data: res };
      this.expenseService.update(gasto.id, payload as any).subscribe({
        next: () => {
          this.snackBar.open('Gasto actualizado', 'Cerrar', { duration: 3000 });
          this.loadAllExpenses();
        },
        error: (err) =>
          this.snackBar.open('Error al actualizar: ' + (err?.message || ''), 'Cerrar', {
            duration: 4000,
          }),
      });
    });
  }

  loadAllExpenses() {
    // load all expenses for admins; for regular users we could scope by user
    this.expenseService.list().subscribe({
      next: (list) => {
        // map backend response to frontend Expense shape
        this.expenses = (list || []).map((s: any) => {
          const d = s.data || {};
          return {
            id: s.idExpense || s.id,
            cardId: d.cardId || '',
            date: this.formatDateOnly(d.date) || '',
            userName: d.userName || d.userId || '-',
            amount: d.amount || 0,
            category: d.category || '',
            description: d.description || '',
            status: (d.status as any) || 'pendiente',
            pdfUrl: d.pdfUrl || '',
          } as Expense;
        });
        this.splitExpensesByStatus();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar gastos: ' + (err?.message || ''), 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }

  openEditById(id: string) {
    const gasto = this.expenses.find((e) => e.id === id);
    if (!gasto) return;
    const dialogRef = this.dialog.open(ExpensesDialog, {
      width: '720px',
      data: { mode: 'edit', expense: gasto, cards: this.cards, isAdmin: this.isAdmin },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload: any = { data: { ...(result as any) } };
      this.expenseService.update(gasto.id, payload as any).subscribe({
        next: () => {
          this.snackBar.open('Gasto actualizado', 'Cerrar', { duration: 3000 });
          this.loadAllExpenses();
        },
        error: (err) =>
          this.snackBar.open('Error al actualizar: ' + (err?.message || ''), 'Cerrar', {
            duration: 4000,
          }),
      });
    });
  }

  deleteSingle(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    this.expenseService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Gasto eliminado', 'Cerrar', { duration: 3000 });
        this.loadAllExpenses();
      },
      error: (err) =>
        this.snackBar.open('Error al eliminar: ' + (err?.message || ''), 'Cerrar', {
          duration: 4000,
        }),
    });
  }
}
