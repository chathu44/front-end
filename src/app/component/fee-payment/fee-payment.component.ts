import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import { FeePaymentService } from '../services/api/fee-payment/fee-payment.service';
import { FeeInvoiceRepresentation } from '../services/api/module/fee-invoice-representation';
import { FeePaymentRepresentation } from '../services/api/module/fee-payment-representation';
import { FeeDocumentService } from '../services/api/fee-payment/fee-document.service';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

type FormMode = 'add' | 'view' | 'edit';

@Component({
  selector: 'app-fee-payment',
  standalone: false,
  templateUrl: './fee-payment.component.html',
  styleUrls: ['./fee-payment.component.scss'],
})
export class FeePaymentComponent implements OnInit {
  activeTab: 'invoices' | 'payments' = 'invoices';

  canView = false;
  canCreate = false;
  canUpdate = false;

  invoiceMode: FormMode = 'add';
  paymentMode: FormMode = 'add';

  invoiceObj: FeeInvoiceRepresentation = this.emptyInvoice();
  paymentObj: FeePaymentRepresentation = this.emptyPayment();

  invoices: FeeInvoiceRepresentation[] = [];
  payments: FeePaymentRepresentation[] = [];

  invoiceSearch = '';
  paymentSearch = '';

  loadingInvoices = false;
  loadingPayments = false;
  saving = false;

  message = '';
  messageIsError = false;

  private statusRows: any[] = [];
  private childOptions: any[] = [];
  private enrollmentOptions: any[] = [];

  private readonly invoiceRowsSubject = new BehaviorSubject<
    FeeInvoiceRepresentation[]
  >([]);

  children$: Observable<any[]> = of([]);
  parents$: Observable<any[]> = of([]);
  enrollments$: Observable<any[]> = of([]);
  enrollmentsForChild$: Observable<any[]> = of([]);
  staff$: Observable<any[]> = of([]);
  statuses$: Observable<any[]> = of([]);

  paymentMethods$: Observable<any[]> = of([
    { value: 'Cash', name: 'Cash' },
    { value: 'Bank Transfer', name: 'Bank Transfer' },
    { value: 'Card', name: 'Card' },
  ]);

  invoiceOptions$: Observable<any[]> = this.invoiceRowsSubject
    .asObservable()
    .pipe(
      map((rows) =>
        rows.map((invoice: any) => ({
          ...invoice,
          displayLabel: this.invoiceOptionLabel(invoice),
        })),
      ),
    );

  readonly currencyCode = 'LKR';
  readonly maxAmount = 99999999.99;

  constructor(
    private feeService: FeePaymentService,
    private permissionHelper: PermissionHelperService,
    private feeDocumentService: FeeDocumentService,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.FEE_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.FEE_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.FEE_UPDATE);

    this.loadLookups();
    this.refreshInvoices();
    this.refreshPayments();
  }

  get canSaveInvoice(): boolean {
    if (this.invoiceMode === 'view') {
      return false;
    }

    return this.invoiceMode === 'add' ? this.canCreate : this.canUpdate;
  }

  get canSavePayment(): boolean {
    return this.paymentMode !== 'view' && this.canUpdate;
  }

  private emptyInvoice(): FeeInvoiceRepresentation {
    return {
      invoiceCode: '',
      billingMonth: '',
      amount: undefined,
      dueDate: '',
      child: null,
      enrollment: null,
      parent: null,
      status: null,
    };
  }

  private emptyPayment(): FeePaymentRepresentation {
    return {
      paymentDate: this.localDateTimeInput(new Date()),
      amount: undefined,
      paymentMethod: 'Cash',
      referenceNo: '',
      invoice: null,
      receivedBy: null,
      status: null,
    };
  }

  private loadLookups(): void {
    this.children$ = this.lookupStream(
      this.feeService.getChildren(),
      (child: any) => ({
        ...child,
        displayLabel:
          `${child.firstName || ''} ${child.lastName || ''}`.trim() +
          ` · ${child.childCode || 'CH-' + child.id}`,
      }),
    );

    this.parents$ = this.lookupStream(
      this.feeService.getParents(),
      (parent: any) => ({
        ...parent,
        displayLabel:
          parent.fullName ||
          `${parent.firstName || ''} ${parent.lastName || ''}`.trim() ||
          `Parent #${parent.id}`,
      }),
    );

    this.enrollments$ = this.lookupStream(
      this.feeService.getEnrollments(),
      (enrollment: any) => ({
        ...enrollment,
        displayLabel: this.enrollmentLabel(enrollment),
      }),
    );

    this.staff$ = this.lookupStream(
      this.feeService.getStaff(),
      (staff: any) => ({
        ...staff,
        displayLabel:
          staff.fullName ||
          staff.name ||
          staff.staffCode ||
          `Staff #${staff.id}`,
      }),
    );

    this.statuses$ = this.feeService.getStatuses().pipe(
      map((response: any) => this.unwrapList(response)),
      catchError((error: any) => {
        console.error('Failed to load fee statuses:', error);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.children$.subscribe((rows) => {
      this.childOptions = rows;
    });

    this.enrollments$.subscribe((rows) => {
      this.enrollmentOptions = rows;
    });

    this.statuses$.subscribe((rows) => {
      this.statusRows = rows;
    });
  }

  private lookupStream(
    source: Observable<any>,
    mapItem: (item: any) => any,
  ): Observable<any[]> {
    return source.pipe(
      map((response: any) => this.unwrapList(response).map(mapItem)),
      catchError((error: any) => {
        console.error('Fee module lookup failed:', error);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private unwrapList(response: any): any[] {
    const candidates = [
      response?.data?.dataList,
      response?.dataList,
      response?.data?.items,
      response?.data?.content,
      response?.items,
      response?.content,
      response?.data,
      response,
    ];

    return candidates.find((value: any) => Array.isArray(value)) || [];
  }

  private unwrapOne(response: any): any {
    const rows = this.unwrapList(response);

    if (rows.length) {
      return rows[0];
    }

    return response?.data?.data ?? response?.data ?? response;
  }

  refreshInvoices(): void {
    this.loadingInvoices = true;

    this.feeService
      .getInvoices()
      .pipe(map((response: any) => this.unwrapList(response)))
      .subscribe({
        next: (rows: FeeInvoiceRepresentation[]) => {
          this.invoices = rows;
          this.invoiceRowsSubject.next(rows);
          this.loadingInvoices = false;
        },
        error: (error: any) => {
          console.error('Failed to load fee invoices:', error);
          this.invoices = [];
          this.invoiceRowsSubject.next([]);
          this.loadingInvoices = false;
          this.showMessage(
            'Could not load invoices. Check the fee-invoice API endpoint.',
            true,
          );
        },
      });
  }

  refreshPayments(): void {
    this.loadingPayments = true;

    this.feeService
      .getPayments()
      .pipe(map((response: any) => this.unwrapList(response)))
      .subscribe({
        next: (rows: FeePaymentRepresentation[]) => {
          this.payments = rows;
          this.invoiceRowsSubject.next(this.invoices);
          this.loadingPayments = false;
        },
        error: (error: any) => {
          console.error('Failed to load fee payments:', error);
          this.payments = [];
          this.loadingPayments = false;
          this.showMessage(
            'Could not load payments. Check the fee-payment API endpoint.',
            true,
          );
        },
      });
  }

  refreshAll(): void {
    this.message = '';
    this.refreshInvoices();
    this.refreshPayments();
  }

  onInvoiceChildChange(childId: any): void {
    this.invoiceObj.child = childId || null;

    const child = this.childOptions.find(
      (item: any) => String(item.id) === String(childId),
    );

    this.invoiceObj.parent = this.relationId(child?.parent);

    this.invoiceObj.enrollment = null;
    this.setEnrollmentFilter(childId);
  }

  private setEnrollmentFilter(childId: any): void {
    this.enrollmentsForChild$ = this.enrollments$.pipe(
      map((rows: any[]) => {
        if (childId === null || childId === undefined || childId === '') {
          return [];
        }

        return rows.filter(
          (enrollment: any) =>
            String(this.relationId(enrollment.child)) === String(childId),
        );
      }),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  onInvoiceEnrollmentChange(enrollmentId: any): void {
    this.invoiceObj.enrollment = enrollmentId || null;

    const enrollment = this.enrollmentOptions.find(
      (item: any) => String(item.id) === String(enrollmentId),
    );

    if (!this.invoiceObj.parent && enrollment?.parent) {
      this.invoiceObj.parent = this.relationId(enrollment.parent);
    }
  }

  private enrollmentLabel(enrollment: any): string {
    const code = enrollment.enrollmentCode || `ENR-${enrollment.id}`;

    const child = enrollment.child;
    const childText =
      typeof child === 'object' && child
        ? `${child.firstName || ''} ${child.lastName || ''}`.trim()
        : `Child #${this.relationId(child) || '?'}`;

    const program = enrollment.program;
    const programText =
      typeof program === 'object' && program
        ? program.programName || program.name || ''
        : '';

    return [code, childText, programText].filter(Boolean).join(' · ');
  }

  newInvoice(): void {
    this.invoiceMode = 'add';
    this.invoiceObj = this.emptyInvoice();
    this.enrollmentsForChild$ = of([]);
    this.message = '';
  }

  selectInvoice(row: FeeInvoiceRepresentation, mode: FormMode = 'view'): void {
    if (!row.id) {
      this.populateInvoice(row, mode);
      return;
    }

    this.feeService.getInvoiceById(row.id).subscribe({
      next: (response: any) => {
        this.populateInvoice(this.unwrapOne(response), mode);
      },
      error: () => {
        this.populateInvoice(row, mode);
      },
    });
  }

  private populateInvoice(
    invoice: FeeInvoiceRepresentation,
    mode: FormMode,
  ): void {
    const childId = this.relationId(invoice.child);
    const child = this.childOptions.find(
      (item: any) => String(item.id) === String(childId),
    );

    this.invoiceObj = {
      ...invoice,
      billingMonth: this.monthToInput(invoice.billingMonth),
      amount: invoice.amount == null ? undefined : Number(invoice.amount),
      child: childId,
      enrollment: this.relationId(invoice.enrollment),
      parent: this.relationId(invoice.parent) ?? this.relationId(child?.parent),
      status: this.relationId(invoice.status),
    };

    this.invoiceMode = mode;
    this.setEnrollmentFilter(childId);
    this.scrollToForm('feeInvoiceForm');
  }

  saveInvoice(): void {
    if (!this.canSaveInvoice || this.invoiceMode === 'view') {
      this.showMessage(
        'You do not have permission to save this invoice.',
        true,
      );
      return;
    }

    const childId = this.relationId(this.invoiceObj.child);
    const enrollmentId = this.relationId(this.invoiceObj.enrollment);
    const parentId = this.relationId(this.invoiceObj.parent);
    const amount = Number(this.invoiceObj.amount);
    const monthInput = String(this.invoiceObj.billingMonth || '');
    const dueDate = String(this.invoiceObj.dueDate || '');

    if (!monthInput || !childId || !enrollmentId || !parentId || !dueDate) {
      this.showMessage(
        'Billing month, child, enrollment, parent and due date are required.',
        true,
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > this.maxAmount ||
      Math.round(amount * 100) !== amount * 100
    ) {
      this.showMessage(
        'Enter a valid invoice amount in LKR, greater than zero and with at most two decimal places.',
        true,
      );
      return;
    }

    if (dueDate < `${monthInput}-01`) {
      this.showMessage(
        'The due date must not be earlier than the selected billing month.',
        true,
      );
      return;
    }

    const enrollment = this.enrollmentOptions.find(
      (item: any) => String(item.id) === String(enrollmentId),
    );

    if (
      !enrollment ||
      String(this.relationId(enrollment.child)) !== String(childId)
    ) {
      this.showMessage(
        'Choose an enrollment that belongs to the selected child.',
        true,
      );
      return;
    }

    const duplicate = this.invoices.some(
      (item: any) =>
        String(item.id) !== String(this.invoiceObj.id || '') &&
        String(this.relationId(item.child)) === String(childId) &&
        this.monthToInput(item.billingMonth) === monthInput,
    );

    if (duplicate) {
      this.showMessage(
        'An invoice already exists for this child and billing month.',
        true,
      );
      return;
    }

    const statusName = this.calculateInvoiceStatus({
      ...this.invoiceObj,
      child: childId,
      dueDate,
      amount,
    });

    const statusId = this.findStatusId(statusName);

    if (statusId === null) {
      this.showMessage(
        `The '${statusName}' status is missing from Status Management. Add that status before saving the invoice.`,
        true,
      );
      return;
    }

    const invoiceCode =
      String(this.invoiceObj.invoiceCode || '').trim() ||
      this.generateInvoiceCode(childId, monthInput);

    if (
      this.invoices.some(
        (item: any) =>
          String(item.id) !== String(this.invoiceObj.id || '') &&
          String(item.invoiceCode || '').toLowerCase() ===
            invoiceCode.toLowerCase(),
      )
    ) {
      this.showMessage(
        'That invoice code is already in use. Change the code and try again.',
        true,
      );
      return;
    }

    const payload: FeeInvoiceRepresentation = {
      id: this.invoiceObj.id,
      invoiceCode,
      billingMonth: this.monthToLabel(monthInput),
      amount,
      dueDate,
      child: childId,
      enrollment: enrollmentId,
      parent: parentId,
      status: statusId,
    };

    this.saving = true;

    const request =
      this.invoiceMode === 'add'
        ? this.feeService.createInvoice(payload)
        : this.feeService.updateInvoice(payload.id!, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showMessage(
          this.invoiceMode === 'add'
            ? 'Invoice created successfully.'
            : 'Invoice updated successfully.',
        );
        this.newInvoice();
        this.refreshInvoices();
        this.refreshPayments();
      },
      error: (error: any) => {
        this.saving = false;
        console.error('Invoice save failed:', error);
        this.showMessage(
          error?.error?.message ||
            'Could not save the invoice. Check the API response and foreign-key values.',
          true,
        );
      },
    });
  }

  newPayment(): void {
    this.paymentMode = 'add';
    this.paymentObj = this.emptyPayment();
    this.message = '';
  }

  selectPayment(row: FeePaymentRepresentation, mode: FormMode = 'view'): void {
    if (!row.id) {
      this.populatePayment(row, mode);
      return;
    }

    this.feeService.getPaymentById(row.id).subscribe({
      next: (response: any) => {
        this.populatePayment(this.unwrapOne(response), mode);
      },
      error: () => this.populatePayment(row, mode),
    });
  }

  private populatePayment(
    payment: FeePaymentRepresentation,
    mode: FormMode,
  ): void {
    this.paymentObj = {
      ...payment,
      paymentDate: this.dateTimeToInput(payment.paymentDate),
      amount: payment.amount == null ? undefined : Number(payment.amount),
      invoice: this.relationId(payment.invoice),
      receivedBy: this.relationId(payment.receivedBy),
      status: this.relationId(payment.status),
    };

    this.paymentMode = mode;
    this.scrollToForm('feePaymentForm');
  }

  savePayment(): void {
    if (!this.canSavePayment || this.paymentMode === 'view') {
      this.showMessage(
        'The FEE_UPDATE permission is required to record or correct payments.',
        true,
      );
      return;
    }

    const invoiceId = this.relationId(this.paymentObj.invoice);
    const staffId = this.relationId(this.paymentObj.receivedBy);
    const amount = Number(this.paymentObj.amount);
    const paymentDate = String(this.paymentObj.paymentDate || '');
    const method = String(this.paymentObj.paymentMethod || '');
    const referenceNo = String(this.paymentObj.referenceNo || '').trim();

    if (!invoiceId || !staffId || !paymentDate || !method) {
      this.showMessage(
        'Payment date, invoice, receiving staff member and payment method are required.',
        true,
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > this.maxAmount ||
      Math.round(amount * 100) !== amount * 100
    ) {
      this.showMessage(
        'Enter a valid positive payment amount in LKR with at most two decimal places.',
        true,
      );
      return;
    }

    if (new Date(paymentDate).getTime() > Date.now()) {
      this.showMessage('Payment date cannot be in the future.', true);
      return;
    }

    if (!['Cash', 'Bank Transfer', 'Card'].includes(method)) {
      this.showMessage('Choose a valid payment method.', true);
      return;
    }

    if (['Bank Transfer', 'Card'].includes(method) && !referenceNo) {
      this.showMessage(
        'A transaction or receipt reference is required for Bank Transfer and Card payments.',
        true,
      );
      return;
    }

    if (referenceNo.length > 50) {
      this.showMessage(
        'The reference number cannot exceed 50 characters.',
        true,
      );
      return;
    }

    const invoice = this.invoices.find(
      (item: any) => String(item.id) === String(invoiceId),
    );

    if (!invoice) {
      this.showMessage(
        'The selected invoice could not be found. Refresh the invoice list.',
        true,
      );
      return;
    }

    const balance = this.outstandingBalance(invoiceId, this.paymentObj.id);

    if (balance <= 0) {
      this.showMessage('This invoice is already fully paid.', true);
      return;
    }

    if (amount > balance + 0.001) {
      this.showMessage(
        `Payment exceeds the remaining balance of ${this.formatLkr(balance)}.`,
        true,
      );
      return;
    }

    const paidStatusId = this.findStatusId('Paid');

    if (paidStatusId === null) {
      this.showMessage(
        "The 'Paid' status is missing from Status Management. Add it before recording payments.",
        true,
      );
      return;
    }

    const payload: FeePaymentRepresentation = {
      id: this.paymentObj.id,
      paymentDate,
      amount,
      paymentMethod: method,
      referenceNo: referenceNo || '',
      invoice: invoiceId,
      receivedBy: staffId,
      status: paidStatusId,
    };

    this.saving = true;

    const request =
      this.paymentMode === 'add'
        ? this.feeService.createPayment(payload)
        : this.feeService.updatePayment(payload.id!, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        const savedInvoiceId = invoiceId;

        this.showMessage(
          this.paymentMode === 'add'
            ? 'Payment recorded successfully.'
            : 'Payment updated successfully.',
        );

        this.newPayment();
        this.synchronizeInvoiceStatus(savedInvoiceId);
      },
      error: (error: any) => {
        this.saving = false;
        console.error('Payment save failed:', error);
        this.showMessage(
          error?.error?.message ||
            'Could not save the payment. Check the API response and selected foreign keys.',
          true,
        );
      },
    });
  }

  private synchronizeInvoiceStatus(invoiceId: any): void {
    this.feeService
      .getPayments()
      .pipe(
        map((response: any) => this.unwrapList(response)),
        switchMap((rows: FeePaymentRepresentation[]) => {
          this.payments = rows;

          const invoice = this.invoices.find(
            (item: any) => String(item.id) === String(invoiceId),
          );

          if (!invoice) {
            return of(null);
          }

          const statusName = this.calculateInvoiceStatus(invoice);
          const statusId = this.findStatusId(statusName);

          if (statusId === null) {
            return of(null);
          }

          const payload: FeeInvoiceRepresentation = {
            ...invoice,
            billingMonth: this.monthToLabel(
              this.monthToInput(invoice.billingMonth),
            ),
            child: this.relationId(invoice.child),
            enrollment: this.relationId(invoice.enrollment),
            parent: this.relationId(invoice.parent),
            status: statusId,
          };

          return this.feeService.updateInvoice(invoice.id!, payload);
        }),
      )
      .subscribe({
        next: () => {
          this.refreshInvoices();
          this.refreshPayments();
        },
        error: (error: any) => {
          console.error('Invoice status synchronization failed:', error);
          this.refreshInvoices();
          this.refreshPayments();
          this.showMessage(
            'The payment was saved, but the invoice status could not be synchronized. Check FEE_UPDATE permission and the invoice API.',
            true,
          );
        },
      });
  }

  get filteredInvoices(): FeeInvoiceRepresentation[] {
    const term = this.invoiceSearch.trim().toLowerCase();

    if (!term) {
      return this.invoices;
    }

    return this.invoices.filter((invoice: any) => {
      const text = [
        invoice.invoiceCode,
        invoice.billingMonth,
        this.childLabel(invoice.child),
        this.parentLabel(invoice.parent),
        this.invoiceStatusLabel(invoice),
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(term);
    });
  }

  get filteredPayments(): FeePaymentRepresentation[] {
    const term = this.paymentSearch.trim().toLowerCase();

    if (!term) {
      return this.payments;
    }

    return this.payments.filter((payment: any) => {
      const text = [
        this.invoiceLabelById(payment.invoice),
        payment.paymentMethod,
        payment.referenceNo,
        this.staffLabel(payment.receivedBy),
        this.paymentStatusLabel(payment),
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(term);
    });
  }

  outstandingBalance(invoiceId: any, excludePaymentId?: any): number {
    const invoice = this.invoices.find(
      (item: any) => String(item.id) === String(invoiceId),
    );

    if (!invoice) {
      return 0;
    }

    const amountDue = Number(invoice.amount || 0);

    const totalPaid = this.payments
      .filter(
        (payment: any) =>
          String(this.relationId(payment.invoice)) === String(invoiceId) &&
          (excludePaymentId === null ||
            excludePaymentId === undefined ||
            String(payment.id) !== String(excludePaymentId)),
      )
      .reduce(
        (total: number, payment: any) => total + Number(payment.amount || 0),
        0,
      );

    return Math.max(0, Math.round((amountDue - totalPaid) * 100) / 100);
  }

  private calculateInvoiceStatus(invoice: any): string {
    const amountDue = Number(invoice?.amount || 0);
    const invoiceId = this.relationId(invoice?.id);

    const totalPaid = this.payments
      .filter(
        (payment: any) =>
          String(this.relationId(payment.invoice)) === String(invoiceId),
      )
      .reduce(
        (total: number, payment: any) => total + Number(payment.amount || 0),
        0,
      );

    if (amountDue > 0 && totalPaid >= amountDue - 0.001) {
      return 'Paid';
    }

    const dueDate = String(invoice?.dueDate || '').slice(0, 10);
    const today = this.localDate(new Date());

    if (dueDate && dueDate < today) {
      return 'Overdue';
    }

    if (totalPaid > 0) {
      return 'Partially Paid';
    }

    return 'Unpaid';
  }

  invoiceStatusLabel(invoice: any): string {
    return this.calculateInvoiceStatus(invoice);
  }

  paymentStatusLabel(payment: any): string {
    return this.statusName(payment?.status) || 'Paid';
  }

  statusClass(status: string): string {
    const value = status.toLowerCase().replace(/\s+/g, '-');
    return `status-${value}`;
  }

  private findStatusId(name: string): any | null {
    const status = this.statusRows.find(
      (item: any) =>
        String(item.name || '')
          .trim()
          .toLowerCase() === name.trim().toLowerCase(),
    );

    return status?.id ?? null;
  }

  private statusName(value: any): string {
    if (value && typeof value === 'object') {
      return value.name || '';
    }

    return (
      this.statusRows.find((item: any) => String(item.id) === String(value))
        ?.name || ''
    );
  }

  private relationId(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return typeof value === 'object' ? (value.id ?? null) : value;
  }

  childLabel(value: any): string {
    const id = this.relationId(value);
    const child =
      value && typeof value === 'object'
        ? value
        : this.childOptions.find((item: any) => String(item.id) === String(id));

    if (!child) {
      return id == null ? '' : `Child #${id}`;
    }

    return (
      `${child.firstName || ''} ${child.lastName || ''}`.trim() ||
      child.childCode ||
      `Child #${child.id}`
    );
  }

  private parentLabel(value: any): string {
    if (value && typeof value === 'object') {
      return (
        value.fullName ||
        `${value.firstName || ''} ${value.lastName || ''}`.trim() ||
        ''
      );
    }

    return String(value || '');
  }

  staffLabel(value: any): string {
    if (value && typeof value === 'object') {
      return value.fullName || value.name || value.staffCode || '';
    }

    return String(value || '');
  }

  private invoiceLabel(invoice: any): string {
    return [
      invoice.invoiceCode || `INV-${invoice.id}`,
      this.childLabel(invoice.child),
      this.monthToLabel(this.monthToInput(invoice.billingMonth)),
      this.formatLkr(this.outstandingBalance(invoice.id)),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  private invoiceOptionLabel(invoice: any): string {
    return this.invoiceLabel(invoice);
  }

  invoiceLabelById(value: any): string {
    if (value && typeof value === 'object') {
      return value.invoiceCode || `INV-${value.id}`;
    }

    const invoice = this.invoices.find(
      (item: any) => String(item.id) === String(this.relationId(value)),
    );

    return invoice
      ? invoice.invoiceCode || `INV-${invoice.id}`
      : String(value || '');
  }

  formatLkr(value: any): string {
    const amount = Number(value || 0);

    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private monthToLabel(value: string): string {
    if (!value) {
      return '';
    }

    const match = value.match(/^(\d{4})-(\d{2})$/);

    if (!match) {
      return value;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);

    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  private monthToInput(value: any): string {
    const text = String(value || '');

    if (/^\d{4}-\d{2}$/.test(text)) {
      return text;
    }

    const match = text.match(/^([A-Za-z]+)\s+(\d{4})$/);

    if (!match) {
      return '';
    }

    const parsed = new Date(`${match[1]} 1, ${match[2]}`);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }

  private generateInvoiceCode(childId: any, month: string): string {
    const [year, monthNumber] = month.split('-');
    const child = this.childOptions.find(
      (item: any) => String(item.id) === String(childId),
    );

    const suffix = String(child?.id || childId).padStart(3, '0');

    return `INV-${year}-${monthNumber}-${suffix}`;
  }

  private dateTimeToInput(value: any): string {
    return value ? String(value).replace(' ', 'T').slice(0, 16) : '';
  }

  private localDateTimeInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 16);
  }

  get maxPaymentDate(): string {
    return this.localDateTimeInput(new Date());
  }

  private localDate(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  private scrollToForm(id: string): void {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  resetInvoiceForm(): void {
    this.newInvoice();
  }

  resetPaymentForm(): void {
    this.newPayment();
  }

  printFeeInvoice(invoice: any): void {
    this.feeDocumentService.printInvoice(invoice, this.payments || []);
  }

  downloadFeeInvoicePdf(invoice: any): void {
    this.feeDocumentService.downloadInvoicePdf(invoice, this.payments || []);
  }

  private findInvoiceForPayment(payment: any): any {
    const invoiceReference = payment?.invoice ?? payment?.feeInvoice;
    if (invoiceReference && typeof invoiceReference === 'object') {
      return invoiceReference;
    }

    const invoiceId =
      (typeof invoiceReference === 'object'
        ? invoiceReference?.id
        : invoiceReference) ??
      payment?.invoiceId ??
      payment?.invoice_id ??
      payment?.feeInvoiceId;

    return (
      (this.invoices || []).find(
        (item: any) =>
          invoiceId != null && String(item?.id) === String(invoiceId),
      ) || {}
    );
  }

  printPaymentReceipt(payment: any): void {
    this.feeDocumentService.printReceipt(
      payment,
      this.findInvoiceForPayment(payment),
      this.payments || [],
    );
  }

  downloadPaymentReceiptPdf(payment: any): void {
    this.feeDocumentService.downloadReceiptPdf(
      payment,
      this.findInvoiceForPayment(payment),
      this.payments || [],
    );
  }

  private showMessage(message: string, isError = false): void {
    this.message = message;
    this.messageIsError = isError;
  }
}
