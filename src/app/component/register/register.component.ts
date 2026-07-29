import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/api/user/user.service';
import { RegisterRepresentation } from '../services/api/module/login-representation';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerObj: RegisterRepresentation = {
    firstName: '',
    lastName: '',
    login: '',
    password: ''
  };
  error = '';
  success = '';

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  register(): void {
    this.error = '';
    this.success = '';

    const { firstName, lastName, login, password } = this.registerObj;
    if (!firstName || !lastName || !login || !password) {
      this.error = 'All fields are required';
      return;
    }

    this.userService.register(this.registerObj).subscribe({
      next: () => {
        this.success = 'Registered successfully. Please login.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
