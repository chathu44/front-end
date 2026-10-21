import { Injectable } from '@angular/core';
import { UserAuthService } from './api/user/user-auth.service';

/** Must match auth_id values in system_authentications (see schema.sql). */
export const AuthIds = {
  // Generic buttons (optional shared IDs)
  BUTTON_SAVE: 7,
  BUTTON_DELETE: 8,

  // Student module
  STUDENT_VIEW: 1,
  STUDENT_CREATE: 2,
  STUDENT_UPDATE: 3,
  STUDENT_DELETE: 4,

  // Course module
  COURSE_VIEW: 10,
  COURSE_CREATE: 11, 
  COURSE_UPDATE: 12,
  COURSE_DELETE: 13,

  // Teacher module
  TEACHER_VIEW: 20,
  TEACHER_CREATE: 21,
  TEACHER_UPDATE: 22,
  TEACHER_DELETE: 23,

  PARENT_VIEW: 30,
  PARENT_CREATE: 31,
  PARENT_UPDATE: 32,
  PARENT_DELETE: 33,

  CHILD_VIEW: 40,
  CHILD_CREATE: 41,
  CHILD_UPDATE: 42,
  CHILD_DELETE: 43,

  CLASSROOM_VIEW: 50,
  CLASSROOM_CREATE: 51,
  CLASSROOM_UPDATE: 52,
  CLASSROOM_DELETE: 53,

  PROGRAM_VIEW: 60,
  PROGRAM_CREATE: 61,
  PROGRAM_UPDATE: 62,
  PROGRAM_DELETE: 63,

  ENROLLMENT_VIEW: 70,
  ENROLLMENT_CREATE: 71,
  ENROLLMENT_UPDATE: 72,
  ENROLLMENT_DELETE: 73,

  ATTENDANCE_VIEW: 80,
  ATTENDANCE_CREATE: 81,
  ATTENDANCE_UPDATE: 82,
  ATTENDANCE_DELETE: 83,

  MEAL_VIEW: 90,
  MEAL_CREATE: 91,
  MEAL_UPDATE: 92,
  MEAL_DELETE: 93,
  
} as const;

@Injectable({ providedIn: 'root' })
export class PermissionHelperService {

  constructor(private userAuthService: UserAuthService) { }

  /** True if the logged-in user has this privilege auth_id. */
  has(authId: number): boolean {
    return this.userAuthService.getAuthIds().includes(authId);
  }

  hasAny(...authIds: number[]): boolean {
    const mine = this.userAuthService.getAuthIds();
    return authIds.some(id => mine.includes(id));
  }
}
