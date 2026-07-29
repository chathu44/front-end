export interface LoginRepresentation {
  login?: string;
  password?: string;
}

export interface RegisterRepresentation {
  firstName?: string;
  lastName?: string;
  login?: string;
  password?: string;
}

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  login: string;
  token: string;
}
