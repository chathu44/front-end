import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class FeeDocumentService {
  downloadInvoicePdf(invoice: any, allPayments: any[] = []): void {
    if (!invoice) return;

    const payments = this.paymentsForInvoice(invoice, allPayments);
    const total = this.numberValue(
      invoice.amount ??
        invoice.invoiceAmount ??
        invoice.totalAmount ??
        invoice.amountDue,
    );
    const paid = payments.reduce(
      (sum, item) => sum + this.numberValue(item.amount),
      0,
    );
    const balance = Math.max(0, total - paid);
    const doc = this.createPdf();
    let y = this.addPdfHeader(
      doc,
      'FEE INVOICE',
      'Monthly daycare fee statement',
    );

    y = this.addPdfSection(doc, 'INVOICE DETAILS', y);
    y = this.addPdfFieldPair(
      doc,
      'Invoice number',
      this.invoiceCode(invoice),
      'Billing month',
      this.value(invoice.billingMonth, invoice.billing_month),
      y,
    );
    y = this.addPdfFieldPair(
      doc,
      'Due date',
      this.dateValue(invoice.dueDate ?? invoice.due_date),
      'Status',
      this.statusValue(invoice.status, invoice.statusName),
      y,
    );

    y = this.addPdfSection(doc, 'BILL TO', y + 2);
    y = this.addPdfFieldPair(
      doc,
      'Parent / guardian',
      this.personName(
        invoice.parent,
        invoice.parentName,
        invoice.parentFullName,
      ) || this.value(invoice.parentId, invoice.parent_id),
      'Child',
      this.personName(
        invoice.child,
        invoice.childName,
        invoice.childFullName,
      ) || this.value(invoice.childId, invoice.child_id),
      y,
    );
    y = this.addPdfField(
      doc,
      'Enrollment',
      this.personName(invoice.enrollment, invoice.enrollmentName) ||
        this.value(invoice.enrollmentId, invoice.enrollment_id),
      15,
      y,
      85,
    );

    y = this.addPdfSection(doc, 'FEE SUMMARY', y + 2);
    y = this.addPdfMoneyFieldPair(
      doc,
      'Invoice amount',
      total,
      'Paid to date',
      paid,
      y,
    );
    y = this.addPdfMoneyField(doc, 'Balance due', balance, 15, y, 85);

    if (payments.length) {
      y = this.addPdfSection(doc, 'PAYMENT HISTORY', y + 2);
      y = this.ensurePdfSpace(doc, y, 24);
      this.drawPaymentTableHeader(doc, y);
      y += 8;
      for (const payment of payments) {
        y = this.ensurePdfSpace(doc, y, 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(45, 55, 72);
        doc.text(
          this.dateValue(payment.paymentDate ?? payment.payment_date),
          15,
          y,
        );
        doc.text(this.paymentMethod(payment), 58, y);
        doc.text(
          this.value(payment.referenceNo, payment.reference_no, payment.id),
          103,
          y,
          { maxWidth: 48 },
        );
        doc.text(this.money(this.numberValue(payment.amount)), 190, y, {
          align: 'right',
        });
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 2.5, 195, y + 2.5);
        y += 8;
      }
    }

    this.addPdfFooter(doc, y + 9);
    doc.save(`${this.safeFileName(this.invoiceCode(invoice))}-invoice.pdf`);
  }

  downloadReceiptPdf(
    payment: any,
    invoice?: any,
    allPayments: any[] = [],
  ): void {
    if (!payment) return;

    const relatedInvoice =
      invoice || payment.invoice || payment.feeInvoice || {};
    const invoiceTotal = this.numberValue(
      relatedInvoice.amount ??
        relatedInvoice.invoiceAmount ??
        relatedInvoice.totalAmount,
    );
    const invoicePayments = this.paymentsForInvoice(
      relatedInvoice,
      allPayments,
    );
    const paidToDate = invoicePayments.length
      ? invoicePayments.reduce(
          (sum, item) => sum + this.numberValue(item.amount),
          0,
        )
      : this.numberValue(payment.amount);
    const balance = Math.max(0, invoiceTotal - paidToDate);
    const doc = this.createPdf();
    let y = this.addPdfHeader(
      doc,
      'PAYMENT RECEIPT',
      'Official record of payment received',
    );

    y = this.addPdfSection(doc, 'RECEIPT DETAILS', y);
    y = this.addPdfFieldPair(
      doc,
      'Receipt / payment ID',
      this.value(payment.id, payment.paymentCode, payment.payment_code),
      'Payment date',
      this.dateValue(payment.paymentDate ?? payment.payment_date),
      y,
    );
    y = this.addPdfFieldPair(
      doc,
      'Invoice number',
      this.invoiceCode(relatedInvoice),
      'Payment method',
      this.paymentMethod(payment),
      y,
    );
    y = this.addPdfFieldPair(
      doc,
      'Reference number',
      this.value(payment.referenceNo, payment.reference_no) || '—',
      'Received by',
      this.personName(
        payment.receivedBy,
        payment.staff,
        payment.receivedByName,
      ) || this.value(payment.receivedById, payment.received_by),
      y,
    );

    y = this.addPdfSection(doc, 'PAYER DETAILS', y + 2);
    y = this.addPdfFieldPair(
      doc,
      'Parent / guardian',
      this.personName(
        relatedInvoice.parent,
        payment.parent,
        relatedInvoice.parentName,
      ) || this.value(relatedInvoice.parentId, relatedInvoice.parent_id),
      'Child',
      this.personName(
        relatedInvoice.child,
        payment.child,
        relatedInvoice.childName,
      ) || this.value(relatedInvoice.childId, relatedInvoice.child_id),
      y,
    );

    y = this.addPdfSection(doc, 'PAYMENT SUMMARY', y + 2);
    y = this.addPdfMoneyFieldPair(
      doc,
      'Amount received on this receipt',
      this.numberValue(payment.amount),
      'Invoice amount',
      invoiceTotal,
      y,
    );
    y = this.addPdfMoneyFieldPair(
      doc,
      'Total paid to date',
      paidToDate,
      'Remaining balance',
      balance,
      y,
    );

    this.addPdfFooter(
      doc,
      y + 14,
      'Thank you. Please keep this receipt for your records.',
    );
    const receiptCode = this.value(
      payment.id,
      payment.referenceNo,
      payment.reference_no,
      'payment-receipt',
    );
    doc.save(`${this.safeFileName(receiptCode)}-receipt.pdf`);
  }

  printInvoice(invoice: any, allPayments: any[] = []): void {
    if (!invoice) return;
    const payments = this.paymentsForInvoice(invoice, allPayments);
    const total = this.numberValue(
      invoice.amount ??
        invoice.invoiceAmount ??
        invoice.totalAmount ??
        invoice.amountDue,
    );
    const paid = payments.reduce(
      (sum, item) => sum + this.numberValue(item.amount),
      0,
    );
    const balance = Math.max(0, total - paid);
    const rows = payments
      .map(
        (p) =>
          `<tr><td>${this.escape(this.dateValue(p.paymentDate ?? p.payment_date))}</td><td>${this.escape(this.paymentMethod(p))}</td><td>${this.escape(this.value(p.referenceNo, p.reference_no, p.id))}</td><td class="right">${this.escape(this.money(this.numberValue(p.amount)))}</td></tr>`,
      )
      .join('');

    const body = `
      ${this.htmlHeader('FEE INVOICE', 'Monthly daycare fee statement')}
      ${this.htmlSection('Invoice details', [
        ['Invoice number', this.invoiceCode(invoice)],
        [
          'Billing month',
          this.value(invoice.billingMonth, invoice.billing_month),
        ],
        ['Due date', this.dateValue(invoice.dueDate ?? invoice.due_date)],
        ['Status', this.statusValue(invoice.status, invoice.statusName)],
      ])}
      ${this.htmlSection('Bill to', [
        [
          'Parent / guardian',
          this.personName(
            invoice.parent,
            invoice.parentName,
            invoice.parentFullName,
          ) || this.value(invoice.parentId, invoice.parent_id),
        ],
        [
          'Child',
          this.personName(
            invoice.child,
            invoice.childName,
            invoice.childFullName,
          ) || this.value(invoice.childId, invoice.child_id),
        ],
        [
          'Enrollment',
          this.personName(invoice.enrollment, invoice.enrollmentName) ||
            this.value(invoice.enrollmentId, invoice.enrollment_id),
        ],
      ])}
      <section><h2>Fee summary</h2><div class="summary"><div><span>Invoice amount</span><strong>${this.escape(this.money(total))}</strong></div><div><span>Paid to date</span><strong>${this.escape(this.money(paid))}</strong></div><div><span>Balance due</span><strong>${this.escape(this.money(balance))}</strong></div></div></section>
      ${payments.length ? `<section><h2>Payment history</h2><table><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="right">Amount</th></tr></thead><tbody>${rows}</tbody></table></section>` : ''}
      <p class="footnote">Please contact the daycare office if you have questions about this invoice.</p>`;
    this.openPrintWindow(`${this.invoiceCode(invoice)} - Fee Invoice`, body);
  }

  printReceipt(payment: any, invoice?: any, allPayments: any[] = []): void {
    if (!payment) return;
    const relatedInvoice =
      invoice || payment.invoice || payment.feeInvoice || {};
    const invoiceTotal = this.numberValue(
      relatedInvoice.amount ??
        relatedInvoice.invoiceAmount ??
        relatedInvoice.totalAmount,
    );
    const invoicePayments = this.paymentsForInvoice(
      relatedInvoice,
      allPayments,
    );
    const paidToDate = invoicePayments.length
      ? invoicePayments.reduce(
          (sum, item) => sum + this.numberValue(item.amount),
          0,
        )
      : this.numberValue(payment.amount);
    const balance = Math.max(0, invoiceTotal - paidToDate);
    const body = `
      ${this.htmlHeader('PAYMENT RECEIPT', 'Official record of payment received')}
      ${this.htmlSection('Receipt details', [
        [
          'Receipt / payment ID',
          this.value(payment.id, payment.paymentCode, payment.payment_code),
        ],
        [
          'Payment date',
          this.dateValue(payment.paymentDate ?? payment.payment_date),
        ],
        ['Invoice number', this.invoiceCode(relatedInvoice)],
        ['Payment method', this.paymentMethod(payment)],
        [
          'Reference number',
          this.value(payment.referenceNo, payment.reference_no) || '—',
        ],
        [
          'Received by',
          this.personName(
            payment.receivedBy,
            payment.staff,
            payment.receivedByName,
          ) || this.value(payment.receivedById, payment.received_by),
        ],
      ])}
      ${this.htmlSection('Payer details', [
        [
          'Parent / guardian',
          this.personName(
            relatedInvoice.parent,
            payment.parent,
            relatedInvoice.parentName,
          ) || this.value(relatedInvoice.parentId, relatedInvoice.parent_id),
        ],
        [
          'Child',
          this.personName(
            relatedInvoice.child,
            payment.child,
            relatedInvoice.childName,
          ) || this.value(relatedInvoice.childId, relatedInvoice.child_id),
        ],
      ])}
      <section><h2>Payment summary</h2><div class="summary"><div><span>Amount received on this receipt</span><strong>${this.escape(this.money(this.numberValue(payment.amount)))}</strong></div><div><span>Invoice amount</span><strong>${this.escape(this.money(invoiceTotal))}</strong></div><div><span>Total paid to date</span><strong>${this.escape(this.money(paidToDate))}</strong></div><div><span>Remaining balance</span><strong>${this.escape(this.money(balance))}</strong></div></div></section>
      <p class="footnote">Thank you. Please keep this receipt for your records.</p>`;
    this.openPrintWindow(
      `Payment Receipt ${this.value(payment.id, payment.referenceNo, payment.reference_no)}`,
      body,
    );
  }

  private createPdf(): jsPDF {
    return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  }

  private addPdfHeader(doc: jsPDF, title: string, subtitle: string): number {
    doc.setFillColor(15, 45, 70);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 15, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, 15, 23);
    doc.setTextColor(45, 55, 72);
    return 43;
  }

  private addPdfSection(doc: jsPDF, title: string, y: number): number {
    y = this.ensurePdfSpace(doc, y, 18);
    doc.setFillColor(232, 246, 244);
    doc.roundedRect(15, y - 4, 180, 8, 1.5, 1.5, 'F');
    doc.setTextColor(15, 96, 91);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, 18, y + 1.5);
    doc.setTextColor(45, 55, 72);
    return y + 12;
  }

  private addPdfField(
    doc: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ): number {
    y = this.ensurePdfSpace(doc, y, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(value || '—', width);
    doc.text(lines, x, y + 4.5);
    doc.setTextColor(45, 55, 72);
    return y + Math.max(12, lines.length * 4 + 7);
  }

  private addPdfMoneyField(
    doc: jsPDF,
    label: string,
    value: number,
    x: number,
    y: number,
    width: number,
  ): number {
    return this.addPdfField(doc, label, this.money(value), x, y, width);
  }

  private addPdfFieldPair(
    doc: jsPDF,
    label1: string,
    value1: string,
    label2: string,
    value2: string,
    y: number,
  ): number {
    const nextLeft = this.addPdfField(doc, label1, value1, 15, y, 85);
    const nextRight = this.addPdfField(doc, label2, value2, 110, y, 85);
    return Math.max(nextLeft, nextRight);
  }

  private addPdfMoneyFieldPair(
    doc: jsPDF,
    label1: string,
    value1: number,
    label2: string,
    value2: number,
    y: number,
  ): number {
    return this.addPdfFieldPair(
      doc,
      label1,
      this.money(value1),
      label2,
      this.money(value2),
      y,
    );
  }

  private drawPaymentTableHeader(doc: jsPDF, y: number): void {
    doc.setFillColor(245, 248, 250);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('DATE', 15, y);
    doc.text('METHOD', 58, y);
    doc.text('REFERENCE', 103, y);
    doc.text('AMOUNT (LKR)', 190, y, { align: 'right' });
  }

  private addPdfFooter(
    doc: jsPDF,
    y: number,
    message = 'Please keep this document for your records.',
  ): void {
    if (y > 275) {
      doc.addPage();
      y = 25;
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(15, y, 195, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(message, 15, y + 6);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 195, y + 6, {
      align: 'right',
    });
  }

  private ensurePdfSpace(
    doc: jsPDF,
    y: number,
    requiredHeight: number,
  ): number {
    if (y + requiredHeight > 278) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  private paymentsForInvoice(invoice: any, allPayments: any[]): any[] {
    const invoiceId = invoice?.id ?? invoice?.invoiceId ?? invoice?.invoice_id;
    const invoiceCode = this.invoiceCode(invoice);
    return (allPayments || []).filter((payment) => {
      const relatedId =
        payment?.invoice?.id ??
        payment?.feeInvoice?.id ??
        payment?.invoiceId ??
        payment?.invoice_id ??
        payment?.feeInvoiceId;
      if (invoiceId != null && relatedId != null)
        return String(invoiceId) === String(relatedId);
      const relatedCode =
        payment?.invoice?.invoiceCode ??
        payment?.invoice?.invoice_code ??
        payment?.feeInvoice?.invoiceCode;
      if (relatedCode && invoiceCode && invoiceCode !== '—')
        return String(invoiceCode) === String(relatedCode);
      return payment?.invoice === invoice || payment?.feeInvoice === invoice;
    });
  }

  private openPrintWindow(title: string, body: string): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.alert(
        'The print window was blocked. Allow pop-ups for this site and try again.',
      );
      return;
    }
    printWindow.document.open();
    printWindow.document
      .write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${this.escape(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;margin:0;padding:28px;font-size:12px}.paper{max-width:820px;margin:0 auto}.brand{background:#0f2d46;color:#fff;padding:24px 26px;border-radius:12px 12px 0 0}.brand h1{font-size:23px;margin:0 0 7px;letter-spacing:.4px}.brand p{font-size:12px;margin:0;color:#dbeafe}section{margin-top:22px}h2{font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#0f766e;border-bottom:1px solid #dbe3ec;padding-bottom:8px;margin:0 0 12px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}.field span{display:block;color:#64748b;font-size:10px;margin-bottom:4px}.field strong{font-size:12px;overflow-wrap:anywhere}.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.summary>div{padding:13px;border:1px solid #dbe3ec;border-radius:8px}.summary span{display:block;color:#64748b;font-size:10px;margin-bottom:6px}.summary strong{font-size:15px;color:#0f2d46}table{width:100%;border-collapse:collapse}th{text-transform:uppercase;font-size:9px;background:#f1f5f9;color:#475569;text-align:left}th,td{padding:9px 8px;border-bottom:1px solid #e2e8f0}.right{text-align:right}.footnote{margin-top:26px;color:#64748b;font-size:10px;border-top:1px solid #dbe3ec;padding-top:12px}.print-actions{display:flex;justify-content:flex-end;gap:8px;margin:0 auto 18px;max-width:820px}.print-actions button{border:0;border-radius:6px;background:#0f766e;color:#fff;padding:9px 14px;font-weight:600;cursor:pointer}.print-actions button:last-child{background:#64748b}@media print{body{padding:0}.paper{max-width:none}.brand{border-radius:0}.print-actions{display:none}section{break-inside:avoid}button{display:none}}
    </style></head><body><div class="print-actions"><button onclick="window.print()">Print / Save as PDF</button><button onclick="window.close()">Close</button></div><main class="paper">${body}</main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  }

  private htmlHeader(title: string, subtitle: string): string {
    return `<header class="brand"><h1>${this.escape(title)}</h1><p>${this.escape(subtitle)}</p></header>`;
  }

  private htmlSection(title: string, fields: Array<[string, string]>): string {
    const fieldHtml = fields
      .map(
        ([label, value]) =>
          `<div class="field"><span>${this.escape(label)}</span><strong>${this.escape(value || '—')}</strong></div>`,
      )
      .join('');
    return `<section><h2>${this.escape(title)}</h2><div class="fields">${fieldHtml}</div></section>`;
  }

  private value(...values: any[]): string {
    const item = values.find(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== '',
    );
    return item === undefined ? '' : String(item);
  }

  private personName(...values: any[]): string {
    for (const item of values) {
      if (item == null) continue;
      if (typeof item === 'string' || typeof item === 'number')
        return String(item);
      const direct = this.value(
        item.fullName,
        item.full_name,
        item.parentName,
        item.childName,
        item.name,
        item.studentName,
        item.staffName,
        item.displayName,
      );
      if (direct) return direct;
      const first = this.value(item.firstName, item.first_name, item.givenName);
      const last = this.value(item.lastName, item.last_name, item.surname);
      const combined = `${first} ${last}`.trim();
      if (combined) return combined;
    }
    return '';
  }

  private invoiceCode(invoice: any): string {
    return (
      this.value(invoice?.invoiceCode, invoice?.invoice_code, invoice?.code) ||
      (invoice?.id != null ? `INV-${invoice.id}` : '—')
    );
  }

  private statusValue(status: any, statusName?: any): string {
    if (status && typeof status === 'object')
      return (
        this.value(
          status.name,
          status.statusName,
          status.status_name,
          status.description,
        ) || '—'
      );
    return this.value(statusName, status) || '—';
  }

  private paymentMethod(payment: any): string {
    const method =
      payment?.paymentMethod ?? payment?.payment_method ?? payment?.method;
    if (method && typeof method === 'object')
      return this.value(method.name, method.description) || '—';
    return this.value(method) || '—';
  }

  private dateValue(value: any): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  }

  private numberValue(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const number = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(number) ? number : 0;
  }

  private money(value: number): string {
    return `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private safeFileName(value: string): string {
    return (
      (value || 'fee-document')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'fee-document'
    );
  }

  private escape(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
