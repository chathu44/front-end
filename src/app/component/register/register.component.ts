import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/api/user/user.service';
import { RegisterRepresentation } from '../services/api/module/login-representation';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerObj: RegisterRepresentation = {
    firstName: '',
    lastName: '',
    login: '',
    password: ''
  };
  error = '';
  loading = false;
  showPassword = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private toast: ToastService
  ) { }

  register(): void {
    this.error = '';
    const { firstName, lastName, login, password } = this.registerObj;
    if (!firstName || !lastName || !login || !password) {
      this.error = 'All fields are required';
      return;
    }

    this.loading = true;
    this.userService.register(this.registerObj).subscribe({
      next: () => {
        this.toast.success('Account created. Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
        this.toast.error(this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
