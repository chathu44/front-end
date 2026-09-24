import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChildRepresentation } from '../module/child-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChildService {

  private baseUrl: string = 'http://localhost:8010/api/v1/child';

  private parentUrl: string = 'http://localhost:8010/api/v1/parent';

  constructor(
    private http: HttpClient
  ) { }

  createChild(child: any, type: any): Observable<any> {
    if (type == 'Add') {
      return this.http.post(this.baseUrl, child);
    } else {
      return this.http.put(this.baseUrl + "/" + child.id, child);
    }
  }

  GetAllChildren(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetChildById(ID: any): Observable<any> {
    return this.http.get(this.baseUrl + "/" + ID);
  }

  DeleteChildById(ID: any): Observable<any> {
    return this.http.delete(this.baseUrl + "/" + ID);
  }

  GetAllParents(): Observable<any> {
    return this.http.get(this.parentUrl);
  }
}