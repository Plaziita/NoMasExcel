export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  address?: string;
  rol: Role;
  expenseIds?: string[];
}

export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}
