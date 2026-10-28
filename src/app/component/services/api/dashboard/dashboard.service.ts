import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardRepresentation } from '../module/dashboard-representation';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = 'http://localhost:8010/api/v1';

  constructor(private http: HttpClient) {}

  getAttendances(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance`);
  }

  getClassrooms(): Observable<any> {
    return this.http.get(`${this.baseUrl}/classroom`);
  }

  getInvoices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fee-invoice`);
  }

  getPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fee-payment`);
  }

  getIncidents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/incident`);
  }

  getChildren(): Observable<any> {
    return this.http.get(`${this.baseUrl}/child`);
  }

  getParents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/parent`);
  }

  getStaff(): Observable<any> {
    return this.http.get(`${this.baseUrl}/staff`);
  }

  getStatuses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/status`);
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/notification`);
  }

  createNotification(notification: DashboardRepresentation): Observable<any> {
    return this.http.post(`${this.baseUrl}/notification`, notification);
  }

  updateNotification(
    id: string | number,
    notification: DashboardRepresentation,
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}/notification/${id}`, notification);
  }
}
