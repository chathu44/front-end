import { Injectable } from '@angular/core';
import { UserAuthService } from './api/user/user-auth.service';

/** Must match auth_id values in system_authentications (see schema.sql). */
export const AuthIds = {
  // Generic buttons (optional shared IDs)
  BUTTON_SAVE: 7,
  BUTTON_DELETE: 8,

  // Student module
  STUDENT_VIEW: 10,
  STUDENT_CREATE: 11,
  STUDENT_UPDATE: 12,
  STUDENT_DELETE: 13,

  // Course module
  COURSE_VIEW: 20,
  COURSE_CREATE: 21,
  COURSE_UPDATE: 22,
  COURSE_DELETE: 23,

  // Teacher module
  TEACHER_VIEW: 30,
  TEACHER_CREATE: 31,
  TEACHER_UPDATE: 32,
  TEACHER_DELETE: 33,

  CHILD_VIEW: 40,
  CHILD_CREATE: 41,
  CHILD_UPDATE: 42,
  CHILD_DELETE: 43,

  PARENT_VIEW: 50,
  PARENT_CREATE: 51,
  PARENT_UPDATE: 52,
  PARENT_DELETE: 53,

  CLASSROOM_VIEW: 60,
  CLASSROOM_CREATE: 61,
  CLASSROOM_UPDATE: 62,
  CLASSROOM_DELETE: 63,

  PROGRAM_VIEW: 70,
  PROGRAM_CREATE: 71,
  PROGRAM_UPDATE: 72,
  PROGRAM_DELETE: 73,

  ENROLLMENT_VIEW: 80,
  ENROLLMENT_CREATE: 81,
  ENROLLMENT_UPDATE: 82,
  ENROLLMENT_DELETE: 83,

  ATTENDANCE_VIEW: 90,
  ATTENDANCE_CREATE: 91,
  ATTENDANCE_UPDATE: 92,
  ATTENDANCE_DELETE: 93

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
