import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../services/api/user/user-auth.service';
import { UserService } from '../services/api/user/user.service';
import { LoginRepresentation } from '../services/api/module/login-representation';

@Component({
  selector: 'app-institute-login',
  templateUrl: './institute-login.component.html',
  styleUrls: ['./institute-login.component.scss'],
})
export class InstituteLoginComponent implements OnInit {
  loginObj: LoginRepresentation = { login: 'admin', password: 'password' };
  error = '';

  constructor(
    private userService: UserService,
    private userAuthService: UserAuthService,
    private router: Router
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

    this.userService.login(this.loginObj).subscribe({
      next: (user) => {
        if (user?.id) {
          this.userService.getAuthIds(user.id).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard'])
          });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        if (err.status === 0) {
          this.error = 'Cannot connect to server at http://localhost:8010';
        } else {
          this.error = err.error?.message || 'Login failed';
        }
      }
    });
  }
}
