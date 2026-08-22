import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QualificationService {

  private readonly baseUrl = `${environment.apiUrl}/api/v1/qualification`;

  constructor(private http: HttpClient) { }

  GetAllQualification(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetQualificationById(id: number | string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createQualification(qualification: any, type: 'Add' | 'Update'): Observable<any> {
    if (type === 'Add') {
      return this.http.post(this.baseUrl, qualification);
    }
    return this.http.put(`${this.baseUrl}/${qualification.id}`, qualification);
  }

  DeleteQualificationById(id: number | string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
