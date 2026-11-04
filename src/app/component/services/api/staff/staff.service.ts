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
    return this.http.post(this.staffUrl, this.toApiPayload(staff));
  }

  updateStaff(
    id: string | number,
    staff: StaffRepresentation,
  ): Observable<any> {
    return this.http.put(`${this.staffUrl}/${id}`, this.toApiPayload(staff));
  }

  private toApiPayload(staff: StaffRepresentation): any {
    const rawUser = staff.user ?? staff.userId ?? staff.user_id;
    const userId =
      rawUser && typeof rawUser === 'object' ? rawUser.id : rawUser;
    const payload: any = {
      ...staff,
      user:
        userId === null || userId === undefined || userId === ''
          ? null
          : { id: Number(userId) },
    };

    delete payload.userId;
    delete payload.user_id;
    return payload;
  }

  getClassrooms(): Observable<any> {
    return this.http.get(this.classroomUrl);
  }

  getStatuses(): Observable<any> {
    return this.http.get(this.statusUrl);
  }
}
