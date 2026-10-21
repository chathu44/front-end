export interface MealRecordRepresentation {
  id?: string | number;
  mealDate?: string;
  mealType?: string;
  ateMeal?: boolean | null;
  notes?: string;
  /** Request value: related child ID. Response value: child object. */
  child?: any;
  /** Request value: related meal-plan ID. Response value: meal-plan object. */
  mealPlan?: any;
}
