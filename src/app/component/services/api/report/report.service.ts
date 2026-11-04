import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Read-only data source for the Reports module.
 * Reports are calculated from the existing module APIs, so no report table
 * or additional backend endpoint is required.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = 'http://localhost:8010/api/v1';

  constructor(private http: HttpClient) {}

  getAttendances(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance`);
  }

  getInvoices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fee-invoice`);
  }

  getPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fee-payment`);
  }

  getClassrooms(): Observable<any> {
    return this.http.get(`${this.baseUrl}/classroom`);
  }

  getChildren(): Observable<any> {
    return this.http.get(`${this.baseUrl}/child`);
  }

  getStaff(): Observable<any> {
    return this.http.get(`${this.baseUrl}/staff`);
  }

  getIncidents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/incident`);
  }

  getStatuses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/status`);
  }
}
