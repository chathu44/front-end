import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MealPlanRepresentation } from '../module/meal-plan-representation';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly baseUrl = 'http://localhost:8010/api/v1/meal-plan';
  private readonly classroomUrl = 'http://localhost:8010/api/v1/classroom';

  constructor(private http: HttpClient) {}

  createMealPlan(mealPlan: MealPlanRepresentation, type: 'Add' | 'Update'): Observable<any> {
    const payload: any = { ...mealPlan };
    payload.mealDate = payload.mealDate || null;
    payload.mealType = payload.mealType || null;
    payload.menuItems = payload.menuItems?.trim() || null;
    payload.classroom = payload.classroom === '' || payload.classroom === undefined ? null : payload.classroom;
    return type === 'Add' ? this.http.post(this.baseUrl, payload) : this.http.put(`${this.baseUrl}/${payload.id}`, payload);
  }

  GetAllMealPlans(): Observable<any> { return this.http.get(this.baseUrl); }
  GetMealPlanById(id: string | number): Observable<any> { return this.http.get(`${this.baseUrl}/${id}`); }
  DeleteMealPlanById(id: string | number): Observable<any> { return this.http.delete(`${this.baseUrl}/${id}`); }
  GetAllClassroomList(): Observable<any> { return this.http.get(this.classroomUrl); }
}
