export interface AttendanceRepresentation {
  id?: string | number;
  attendanceDate?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkedInBy?: any;
  checkedOutBy?: any;
  pickupPerson?: string;
  notes?: string;
  
  child?: any;
  classroom?: any;
  status?: any;
}
