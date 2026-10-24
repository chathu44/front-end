import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidentRepresentation } from '../module/incident-representation';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private readonly baseUrl =
    'http://localhost:8010/api/v1/incident';

  private readonly childUrl =
    'http://localhost:8010/api/v1/child';

  private readonly classroomUrl =
    'http://localhost:8010/api/v1/classroom';

  private readonly staffUrl =
    'http://localhost:8010/api/v1/staff';

  constructor(private http: HttpClient) {}

  // Register a new incident or update an existing incident.
  SaveIncident(
    incident: IncidentRepresentation,
    isEdit: boolean
  ): Observable<any> {
    const payload: any = { ...incident };

    // datetime-local normally returns yyyy-MM-ddTHH:mm.
    // Add seconds for LocalDateTime-compatible backends.
    if (payload.incidentDate) {
      if (
        typeof payload.incidentDate === 'string' &&
        payload.incidentDate.length === 16
      ) {
        payload.incidentDate += ':00';
      }
    } else {
      payload.incidentDate = null;
    }

    // Send relationship IDs rather than full UI objects.
    payload.child = this.relationshipId(payload.child);
    payload.classroom = this.relationshipId(payload.classroom);
    payload.reportedBy = this.relationshipId(payload.reportedBy);
    payload.status = this.relationshipId(payload.status);

    payload.parentNotified = payload.parentNotified === true;

    if (isEdit && payload.id != null) {
      return this.http.put(
        `${this.baseUrl}/${payload.id}`,
        payload
      );
    }

    delete payload.id;

    return this.http.post(this.baseUrl, payload);
  }

  GetAllIncidents(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetIncidentById(id: string | number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  DeleteIncidentById(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  GetAllChildList(): Observable<any> {
    return this.http.get(this.childUrl);
  }

  GetAllClassroomList(): Observable<any> {
    return this.http.get(this.classroomUrl);
  }

  GetAllReportedByList(): Observable<any> {
    return this.http.get(this.staffUrl);
  }

  private relationshipId(value: any): string | number | null {
    if (value == null || value === '') {
      return null;
    }

    const id =
      typeof value === 'object'
        ? value.id
        : value;

    if (id == null || id === '') {
      return null;
    }

    // Convert numeric dropdown IDs to numbers for the API.
    if (
      typeof id === 'string' &&
      /^\d+$/.test(id)
    ) {
      return Number(id);
    }

    return id;
  }
}