export interface StatusRepresentation {
  id?: string | number;
  name?: string;
}

export interface ParentRepresentation {
  id?: string | number;
  fullName?: string;
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

  /** Request: parent id. Response: parent object */
  parent?: any;

  /** Request: status id. Response: { id, name } */
  status?: any;
}