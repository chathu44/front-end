import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChildRepresentation } from '../module/child-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChildService {
  private baseUrl: string = 'http://localhost:8010/api/v1/child';

  private parentUrl: string = 'http://localhost:8010/api/v1/parent';

  constructor(private http: HttpClient) {}

  createChild(child: ChildRepresentation, type: string): Observable<any> {
    const payload: any = {
      ...child,
    };

    if (
      payload.parent !== null &&
      payload.parent !== undefined &&
      typeof payload.parent !== 'object'
    ) {
      payload.parent = Number(payload.parent);
    }

    if (
      payload.status !== null &&
      payload.status !== undefined &&
      typeof payload.status !== 'object'
    ) {
      payload.status = Number(payload.status);
    }

    if (payload.dateOfBirth === '') {
      payload.dateOfBirth = null;
    }

    if (type === 'Add') {
      return this.http.post(this.baseUrl, payload);
    } else {
      return this.http.put(this.baseUrl + '/' + payload.id, payload);
    }
  }

  GetAllChildren(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetChildById(ID: any): Observable<any> {
    return this.http.get(this.baseUrl + '/' + ID);
  }

  DeleteChildById(ID: any): Observable<any> {
    return this.http.delete(this.baseUrl + '/' + ID);
  }

  GetAllParents(): Observable<any> {
    return this.http.get(this.parentUrl);
  }
}
