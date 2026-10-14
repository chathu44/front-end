import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AttendanceRepresentation } from '../module/attendance-representation';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly baseUrl = 'http://localhost:8010/api/v1/attendance';
  private readonly staffUrl = 'http://localhost:8010/api/v1/staff';
  private readonly childUrl = 'http://localhost:8010/api/v1/child';
  private readonly classroomUrl = 'http://localhost:8010/api/v1/classroom';
  private readonly enrollmentUrl = 'http://localhost:8010/api/v1/enrollment';

  constructor(private http: HttpClient) {}

  createAttendance(
    attendance: AttendanceRepresentation,
    type: 'Add' | 'Update' | string
  ): Observable<any> {
    const payload: any = { ...attendance };

    payload.child = this.relationId(payload.child);
    payload.classroom = this.relationId(payload.classroom);
    payload.status = this.relationId(payload.status);
    payload.checkedInBy = this.relationId(payload.checkedInBy);
    payload.checkedOutBy = this.relationId(payload.checkedOutBy);

    if (!payload.attendanceDate) {
      payload.attendanceDate = null;
    }

    payload.checkInTime = this.normalizeDateTime(payload.checkInTime);
    payload.checkOutTime = this.normalizeDateTime(payload.checkOutTime);

    if (type === 'Add') {
      return this.http.post(this.baseUrl, payload);
    }

    return this.http.put(this.baseUrl + '/' + payload.id, payload);
  }

  GetAllAttendances(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetAttendanceById(id: any): Observable<any> {
    return this.http.get(this.baseUrl + '/' + id);
  }

  DeleteAttendanceById(id: any): Observable<any> {
    return this.http.delete(this.baseUrl + '/' + id);
  }

  GetAllStaffList(): Observable<any> {
    return this.http.get(this.staffUrl);
  }

  GetAllChildList(): Observable<any> {
    return this.http.get(this.childUrl);
  }

  GetAllClassroomList(): Observable<any> {
    return this.http.get(this.classroomUrl);
  }

  GetAllEnrollmentList(): Observable<any> {
    return this.http.get(this.enrollmentUrl);
  }

  private relationId(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return typeof value === 'object' ? (value.id ?? null) : value;
  }

  private normalizeDateTime(value: any): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const textValue = String(value).replace(' ', 'T');
    return textValue.length === 16 ? textValue + ':00' : textValue;
  }
}

