export interface MealRecordRepresentation {
  id?: string | number;
  mealDate?: string;
  mealType?: string;
  ateMeal?: boolean | null;
  notes?: string;

  child?: any;
  mealPlan?: any;
}
