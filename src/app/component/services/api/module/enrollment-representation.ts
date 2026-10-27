export interface EnrollmentRepresentation {
  id?: string | number;
  enrollmentCode?: string;
  enrollDate?: string;
  startDate?: string;
  endDate?: string;
  
  child?: any;
  parent?: any;
  program?: any;
  classroom?: any;
  status?: any;
}