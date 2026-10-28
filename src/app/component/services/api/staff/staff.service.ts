import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { StaffRepresentation } from '../module/staff-representation';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private readonly baseUrl = 'http://localhost:8010/api/v1';

  private readonly staffUrl = `${this.baseUrl}/staff`;
  private readonly classroomUrl = `${this.baseUrl}/classroom`;
  private readonly statusUrl = `${this.baseUrl}/status`;

  constructor(private http: HttpClient) {}

  getAllStaff(): Observable<any> {
    return this.http.get(this.staffUrl);
  }

  getStaffById(id: string | number): Observable<any> {
    return this.http.get(`${this.staffUrl}/${id}`);
  }

  createStaff(staff: StaffRepresentation): Observable<any> {
    return this.http.post(this.staffUrl, staff);
  }

  updateStaff(
    id: string | number,
    staff: StaffRepresentation,
  ): Observable<any> {
    return this.http.put(`${this.staffUrl}/${id}`, staff);
  }

  getClassrooms(): Observable<any> {
    return this.http.get(this.classroomUrl);
  }

  getStatuses(): Observable<any> {
    return this.http.get(this.statusUrl);
  }
}
