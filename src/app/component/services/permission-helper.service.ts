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
