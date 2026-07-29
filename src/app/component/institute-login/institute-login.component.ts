import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../services/api/user/user-auth.service';
import { UserService } from '../services/api/user/user.service';
import { LoginRepresentation } from '../services/api/module/login-representation';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-institute-login',
  templateUrl: './institute-login.component.html',
  styleUrls: ['./institute-login.component.scss'],
})
export class InstituteLoginComponent implements OnInit {
  loginObj: LoginRepresentation = { login: 'admin', password: 'password' };
  error = '';
  loading = false;
  showPassword = false;

  constructor(
    private userService: UserService,
    private userAuthService: UserAuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    if (this.userAuthService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login(): void {
    this.error = '';

    if (!this.loginObj.login || !this.loginObj.password) {
      this.error = 'Login and password are required';
      return;
    }

    this.loading = true;
    this.userService.login(this.loginObj).subscribe({
      next: (user) => {
        const go = () => {
          this.toast.success(`Welcome back, ${user.firstName || user.login}`);
          this.router.navigate(['/dashboard']);
        };
        if (user?.id) {
          this.userService.getAuthIds(user.id).subscribe({ next: go, error: go });
        } else {
          go();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 0
          ? 'Cannot connect to server at http://localhost:8010'
          : (err.error?.message || 'Login failed');
        this.toast.error(this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
