import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserAuthService } from '../services/api/user/user-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private userAuthService: UserAuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (!this.userAuthService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Optional: if route declares requiredAuthIds, check privilege IDs from /get-auth-ids/{id}
    const requiredAuthIds = route.data['requiredAuthIds'] as number[] | undefined;
    if (requiredAuthIds?.length) {
      const userAuthIds = this.userAuthService.getAuthIds();
      const allowed = requiredAuthIds.some(id => userAuthIds.includes(id));
      if (!allowed) {
        this.router.navigate(['/forbidden']);
        return false;
      }
    }

    return true;
  }
}
