import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnrollmentRepresentation } from '../module/enrollment-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  private baseUrl: string =
    'http://localhost:8010/api/v1/enrollment';

  private childUrl: string =
    'http://localhost:8010/api/v1/child';

  private parentUrl: string =
    'http://localhost:8010/api/v1/parent';

  private programUrl: string =
    'http://localhost:8010/api/v1/program';

  private classroomUrl: string =
    'http://localhost:8010/api/v1/classroom';

  constructor(
    private http: HttpClient
  ) {}

  createEnrollment(
    enrollment: EnrollmentRepresentation,
    type: string
  ): Observable<any> {

    const payload: any = {
      ...enrollment
    };


    delete payload.statusChanged;


    if (payload.enrollDate === '') {
      payload.enrollDate = null;
    }

    if (payload.startDate === '') {
      payload.startDate = null;
    }

    if (payload.endDate === '') {
      payload.endDate = null;
    }

 
    const relationFields: string[] = [
      'child',
      'parent',
      'program',
      'classroom',
      'status'
    ];

    relationFields.forEach((field: string) => {

      const value = payload[field];

      if (
        value !== null &&
        value !== undefined &&
        typeof value === 'object'
      ) {
        payload[field] = value.id;
      }

      if (
        payload[field] !== null &&
        payload[field] !== undefined &&
        payload[field] !== ''
      ) {
        payload[field] = Number(payload[field]);
      }
    });

    if (type === 'Add') {
      return this.http.post(
        this.baseUrl,
        payload
      );
    }

    return this.http.put(
      this.baseUrl + '/' + payload.id,
      payload
    );
  }

  GetAllEnrollments(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetEnrollmentById(ID: any): Observable<any> {
    return this.http.get(
      this.baseUrl + '/' + ID
    );
  }

  DeleteEnrollmentById(ID: any): Observable<any> {
    return this.http.delete(
      this.baseUrl + '/' + ID
    );
  }

  GetAllChildList(): Observable<any> {
    return this.http.get(this.childUrl);
  }

  GetAllParentList(): Observable<any> {
    return this.http.get(this.parentUrl);
  }

  GetAllProgramList(): Observable<any> {
    return this.http.get(this.programUrl);
  }

  GetAllClassroomList(): Observable<any> {
    return this.http.get(this.classroomUrl);
  }
}