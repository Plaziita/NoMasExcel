// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/userService/user';
import { CommonModule } from '@angular/common';
import { Role, User } from '../../models/User';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  ngOnInit(): void {
    this.userService.checkSession().subscribe({
      next: (res) => {
        if (res && res.authenticated) {
          this.router.navigate(['/home']);
        }
      },
      error: () => {},
    });
  }
  authForm!: FormGroup;
  isLoginMode = true;
  successMessage = '';
  errorMessage = '';

  showPopup = false;

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
    this.initForm();
  }

  private initForm() {
    this.authForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      name: [''],
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    if (this.isLoginMode) {
      this.authForm.get('name')?.clearValidators();
      this.authForm.get('email')?.clearValidators();
    } else {
      this.authForm.get('name')?.setValidators(Validators.required);
      this.authForm.get('email')?.setValidators([Validators.required, Validators.email]);
    }
    this.authForm.get('name')?.updateValueAndValidity();
    this.authForm.get('email')?.updateValueAndValidity();
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.authForm.invalid) return;

    const formValue = this.authForm.value;

    if (this.isLoginMode) {
      // Login
      this.userService.login(formValue).subscribe({
        next: (user) => {
          // Guardar bandera de login exitoso para mostrar popup en home
          localStorage.setItem('showLoginPopup', '1');
          this.router.navigate(['/home']);
        },
        error: (err) => (this.errorMessage = 'Usuario o contraseña incorrectos'),
      });
    } else {
      const newUser: User = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        rol: Role.EMPLOYEE,
      };

      this.userService.register(newUser).subscribe({
        next: (user) => (this.successMessage = `Usuario ${user.name} registrado con éxito`),
        error: (err) => (this.errorMessage = 'Error registrando usuario'),
      });
    }
  }
}
