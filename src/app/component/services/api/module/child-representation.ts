export interface StatusRepresentation {
  id?: string | number;
  name?: string;
}

export interface ChildRepresentation {
  id?: string | number;

  childCode?: string;

  firstName?: string;

  lastName?: string;

  dateOfBirth?: string;

  gender?: string;

  bloodGroup?: string;

  allergies?: string;

  medicalNotes?: string;

  photoUrl?: string;

  parent?: any;

  status?: any;
}
