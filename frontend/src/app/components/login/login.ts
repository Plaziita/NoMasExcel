// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
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
export class LoginComponent {
  authForm!: FormGroup;
  isLoginMode = true;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private userService: UserService) {
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
        next: (user) => (this.successMessage = `Bienvenido ${user.name}`),
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
