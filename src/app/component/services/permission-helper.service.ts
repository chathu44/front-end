import { Injectable } from '@angular/core';
import { UserAuthService } from './api/user/user-auth.service';

/** Common auth_id values from system_authentications (see backend schema.sql). */
export const AuthIds = {
  STUDENT_VIEW: 10,
  STUDENT_CREATE: 11,
  STUDENT_UPDATE: 12,
  STUDENT_DELETE: 13,
  BUTTON_SAVE: 7,
  BUTTON_DELETE: 8,
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
