export interface MealPlanRepresentation {
  id?: string | number;
  mealDate?: string;
  mealType?: string;
  menuItems?: string;
  /** Request value: related classroom ID. Response value: classroom object. */
  classroom?: any;
}
