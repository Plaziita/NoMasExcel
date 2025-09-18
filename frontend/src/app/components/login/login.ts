import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  authForm!: FormGroup;
  isLoginMode = true;
  popupMessage: string | null = null;
  popupType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

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

  private initForm() {
    this.authForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      name: [''],
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;

    const nameCtrl = this.authForm.get('name');
    const emailCtrl = this.authForm.get('email');
    const passwordCtrl = this.authForm.get('password');

    if (this.isLoginMode) {
      nameCtrl?.clearValidators();
      emailCtrl?.clearValidators();
    } else {
      nameCtrl?.setValidators(Validators.required);
      emailCtrl?.setValidators([Validators.required, Validators.email]);
    }

    [nameCtrl, emailCtrl, passwordCtrl].forEach((ctrl) => {
      ctrl?.updateValueAndValidity();
      ctrl?.markAsUntouched();
      ctrl?.markAsPristine();
    });
  }

  onSubmit() {
    this.popupMessage = null;

    if (this.authForm.invalid) return;

    const formValue = this.authForm.value;

    if (this.isLoginMode) {
      this.userService.login(formValue).subscribe({
        next: () => {
          this.showPopupMessage('¡Logeado con éxito!', 1500, 'success', '/home');
        },
        error: () => {
          this.showPopupMessage('Usuario o contraseña incorrectos', 2000, 'error');
        },
      });
    } else {
      const newUser: User = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        rol: Role.EMPLOYEE,
      };

      this.userService.register(newUser).subscribe({
        next: (res: any) => {
          if (res && res.error) {
            if (res.error.includes('email')) {
              this.showPopupMessage('Ya existe un usuario con ese email', 2500, 'error');
            } else {
              this.showPopupMessage('Error registrando usuario', 2500, 'error');
            }
          } else if (res && res.user) {
            this.showPopupMessage(
              `Usuario ${res.user.name} registrado con éxito`,
              2000,
              'success',
              '/home'
            );
          } else {
            this.showPopupMessage('Respuesta inesperada del servidor', 2500, 'error');
          }
        },
        error: (err) => {
          if (err?.error?.error && err.error.error.includes('email')) {
            this.showPopupMessage('Ya existe un usuario con ese email', 2500, 'error');
          } else {
            this.showPopupMessage('Error registrando usuario', 2500, 'error');
          }
        },
      });
    }
  }

  showPopupMessage(
    message: string,
    duration = 2000,
    type: 'success' | 'error' | 'info' = 'info',
    redirectUrl?: string
  ) {
    this.popupMessage = message;
    this.popupType = type;
    this.cdr.detectChanges?.();
    setTimeout(() => {
      this.popupMessage = null;
      this.cdr.detectChanges?.();
      if (redirectUrl) {
        setTimeout(() => {
          this.router.navigate([redirectUrl]);
        }, 200);
      }
    }, duration);
  }
}
