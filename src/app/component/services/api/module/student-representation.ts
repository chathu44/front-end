export interface StatusRepresentation {
  id?: string | number;
  name?: string;
}

export interface StudentRepresentation {
  id?: string | number;
  studentCode?: string;
  studentName?: string;
  studentAge?: string;
  studentNic?: string;

  status?: any;
}
