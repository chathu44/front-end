import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from './component/services/api/user/user-auth.service';
import { ToastService } from './component/services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'template-angular';

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    public toastService: ToastService
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

  isLoggedIn(): boolean {
    return this.userAuthService.isLoggedIn();
  }

  logOut(): void {
    this.userAuthService.clear();
    this.toastService.info('Signed out');
    this.router.navigate(['/login']);
  }
}
