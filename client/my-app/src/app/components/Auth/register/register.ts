import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth'
import { InputMaskModule } from 'primeng/inputmask';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterModule } from '@angular/router';
import { UserDto } from '../../../models/user';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    InputMaskModule,
    FormsModule,
    CommonModule,
    MessageModule,
    PasswordModule,
    CardModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    RouterModule],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.sass',
})

export class Register implements OnInit {
  registerForm!: FormGroup;
  private authServ = inject(AuthService)
  private router = inject(Router);
  private msg = inject(MessageService);
  isSubmitting = false;
  successMessage: string = '';
  errorMessage: string = '';


  ngOnInit() {
    this.registerForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      passwordHash: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]),
      phone: new FormControl('', Validators.pattern('^05[0-9]-[0-9]{7}$'))
    });
  }


  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const v = this.registerForm.getRawValue()

    const dtoToServer: UserDto = {
      UserName: v.email,
      Name: v.name,
      Password: v.passwordHash,
      Phone: (v.phone ?? '').replace(/\D/g, '')
    };

    this.authServ.registerUser(dtoToServer).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Success', detail: 'User registered successfully!' });
        this.registerForm.reset();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const serverMsg = err?.error?.message ?? (typeof err?.error === 'string' ? err.error : null) ?? 'Registration failed';
        console.log('STATUS:', err.status);
        console.log('ERROR BODY:', err.error);
        console.log('MESSAGE:', err.message);
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        this.isSubmitting = false;

      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
