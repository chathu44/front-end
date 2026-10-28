import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FeeInvoiceRepresentation } from '../module/fee-invoice-representation';
import { FeePaymentRepresentation } from '../module/fee-payment-representation';

@Injectable({
  providedIn: 'root',
})
export class FeePaymentService {
  private readonly baseUrl = 'http://localhost:8010/api/v1';

  private readonly invoiceUrl = `${this.baseUrl}/fee-invoice`;
  private readonly paymentUrl = `${this.baseUrl}/fee-payment`;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<any> {
    return this.http.get(this.invoiceUrl);
  }

  getInvoiceById(id: string | number): Observable<any> {
    return this.http.get(`${this.invoiceUrl}/${id}`);
  }

  createInvoice(invoice: FeeInvoiceRepresentation): Observable<any> {
    return this.http.post(this.invoiceUrl, invoice);
  }

  updateInvoice(
    id: string | number,
    invoice: FeeInvoiceRepresentation,
  ): Observable<any> {
    return this.http.put(`${this.invoiceUrl}/${id}`, invoice);
  }

  getPayments(): Observable<any> {
    return this.http.get(this.paymentUrl);
  }

  getPaymentById(id: string | number): Observable<any> {
    return this.http.get(`${this.paymentUrl}/${id}`);
  }

  createPayment(payment: FeePaymentRepresentation): Observable<any> {
    return this.http.post(this.paymentUrl, payment);
  }

  updatePayment(
    id: string | number,
    payment: FeePaymentRepresentation,
  ): Observable<any> {
    return this.http.put(`${this.paymentUrl}/${id}`, payment);
  }

  getChildren(): Observable<any> {
    return this.http.get(`${this.baseUrl}/child`);
  }

  getParents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/parent`);
  }

  getEnrollments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/enrollment`);
  }

  getStaff(): Observable<any> {
    return this.http.get(`${this.baseUrl}/staff`);
  }

  getStatuses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/status`);
  }
}
