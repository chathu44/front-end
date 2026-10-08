import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ParentRepresentation } from '../module/parent-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParentService {

  private baseUrl: string =
    'http://localhost:8010/api/v1/parent';

  constructor(
    private http: HttpClient
  ) { }

  createParent(
    parent: ParentRepresentation,
    type: string
  ): Observable<any> {

    const payload: any = {
      ...parent
    };

    if (
      payload.status !== null &&
      payload.status !== undefined &&
      typeof payload.status !== 'object'
    ) {
      payload.status = Number(payload.status);
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

  GetAllParents(): Observable<any> {
    return this.http.get(
      this.baseUrl
    );
  }

  GetParentById(
    ID: any
  ): Observable<any> {
    return this.http.get(
      this.baseUrl + '/' + ID
    );
  }

  DeleteParentById(
    ID: any
  ): Observable<any> {
    return this.http.delete(
      this.baseUrl + '/' + ID
    );
  }
}