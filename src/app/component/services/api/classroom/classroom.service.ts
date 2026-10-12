import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ClassroomRepresentation } from '../module/classroom-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {

  private baseUrl: string =
    'http://localhost:8010/api/v1/classroom';

  constructor(
    private http: HttpClient
  ) { }

  createClassroom(
    classroom: ClassroomRepresentation,
    type: string
  ): Observable<any> {

    const payload: any = {
      ...classroom
    };

    if (
      payload.status !== null &&
      payload.status !== undefined &&
      typeof payload.status !== 'object'
    ) {
      payload.status = Number(payload.status);
    }

    if (payload.capacity !== null &&
        payload.capacity !== undefined &&
        payload.capacity !== '') {
      payload.capacity = Number(payload.capacity);
    }

    if (type === 'Add') {
      return this.http.post(
        this.baseUrl,
        payload
      );
    } else {
      return this.http.put(
        this.baseUrl + '/' + payload.id,
        payload
      );
    }
  }

  GetAllClassrooms(): Observable<any> {
    return this.http.get(
      this.baseUrl
    );
  }

  GetClassroomById(
    ID: any
  ): Observable<any> {
    return this.http.get(
      this.baseUrl + '/' + ID
    );
  }

  DeleteClassroomById(
    ID: any
  ): Observable<any> {
    return this.http.delete(
      this.baseUrl + '/' + ID
    );
  }
}