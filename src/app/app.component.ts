import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from './component/services/api/user/user-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'institute-web';

  constructor(
    private router: Router,
    private userAuthService: UserAuthService
  ) { }

  get displayName(): string {
    const user = this.userAuthService.getUser();
    if (!user) {
      return '';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
      || user.login
      || `User #${user.id}`;
  }

  get userId(): number | null {
    return this.userAuthService.getUserId();
  }

  logIn(): void {
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.userAuthService.isLoggedIn();
  }

  logOut(): void {
    this.userAuthService.clear();
    this.router.navigate(['/login']);
  }
}
