export interface StaffRepresentation {
  id?: string | number;

  staffCode?: string;

  userId?: string | number | null;
  user_id?: string | number | null;

  fullName?: string;
  role?: string;
  phone?: string;
  nic?: string;
  hireDate?: string;

  classroom?: any;
  classroomId?: string | number | null;
  classroom_id?: string | number | null;

  status?: any;
  statusId?: string | number | null;
  status_id?: string | number | null;
}