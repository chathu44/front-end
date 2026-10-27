import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MealRecordRepresentation } from '../module/meal-record-representation';

@Injectable({ providedIn: 'root' })
export class MealRecordService {
  private readonly baseUrl = 'http://localhost:8010/api/v1/meal-record';
  private readonly childUrl = 'http://localhost:8010/api/v1/child';
  private readonly mealPlanUrl = 'http://localhost:8010/api/v1/meal-plan';

  constructor(private http: HttpClient) {}

  createMealRecord(
    mealRecord: MealRecordRepresentation,
    type: 'Add' | 'Update',
  ): Observable<any> {
    const payload: any = { ...mealRecord };
    payload.mealDate = payload.mealDate || null;
    payload.mealType = payload.mealType || null;
    payload.notes = payload.notes?.trim() || null;
    payload.child =
      payload.child === '' || payload.child === undefined
        ? null
        : payload.child;
    payload.mealPlan =
      payload.mealPlan === '' || payload.mealPlan === undefined
        ? null
        : payload.mealPlan;
    return type === 'Add'
      ? this.http.post(this.baseUrl, payload)
      : this.http.put(`${this.baseUrl}/${payload.id}`, payload);
  }

  GetAllMealRecords(): Observable<any> {
    return this.http.get(this.baseUrl);
  }
  GetMealRecordById(id: string | number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }
  DeleteMealRecordById(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  GetAllChildList(): Observable<any> {
    return this.http.get(this.childUrl);
  }
  GetAllMealPlanList(): Observable<any> {
    return this.http.get(this.mealPlanUrl);
  }
}
