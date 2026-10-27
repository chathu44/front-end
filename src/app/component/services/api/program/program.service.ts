import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProgramRepresentation } from '../module/program-representation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgramService {
  private baseUrl: string = 'http://localhost:8010/api/v1/program';

  constructor(private http: HttpClient) {}

  createProgram(program: ProgramRepresentation, type: string): Observable<any> {
    const payload: any = {
      ...program,
    };

    if (payload.sessionStart === '') {
      payload.sessionStart = null;
    }

    if (payload.sessionStart && payload.sessionStart.length === 5) {
      payload.sessionStart += ':00';
    }

    if (payload.sessionEnd === '') {
      payload.sessionEnd = null;
    }

    if (payload.sessionEnd && payload.sessionEnd.length === 5) {
      payload.sessionEnd += ':00';
    }

    if (
      payload.status !== null &&
      payload.status !== undefined &&
      typeof payload.status === 'object'
    ) {
      payload.status = payload.status.id;
    } else if (
      payload.status !== null &&
      payload.status !== undefined &&
      payload.status !== ''
    ) {
      payload.status = Number(payload.status);
    }

    if (
      payload.monthlyFee !== null &&
      payload.monthlyFee !== undefined &&
      payload.monthlyFee !== ''
    ) {
      payload.monthlyFee = Number(payload.monthlyFee);
    }

    if (type === 'Add') {
      return this.http.post(this.baseUrl, payload);
    }

    return this.http.put(this.baseUrl + '/' + payload.id, payload);
  }

  GetAllPrograms(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  GetProgramById(ID: any): Observable<any> {
    return this.http.get(this.baseUrl + '/' + ID);
  }

  DeleteProgramById(ID: any): Observable<any> {
    return this.http.delete(this.baseUrl + '/' + ID);
  }
}
