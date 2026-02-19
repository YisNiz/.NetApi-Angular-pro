import { ChangeDetectorRef, Component, inject ,OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth'  
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
import { Router } from '@angular/router';
import { LoginRequest } from '../../../models/user';
import { LoginResponseDto } from '../../../models/user';
import {  RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
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
    RouterModule
    
    ],
  providers:[MessageService ],
  templateUrl: './login.html',
  styleUrl: './login.sass',
})
export class Login {
  loginForm!:FormGroup;
  private authServ=inject(AuthService)
  private router= inject(Router);
  private msg = inject(MessageService);
  private ref = inject(ChangeDetectorRef)
  isSubmitting = false;
  successMessage: string = '';
  errorMessage: string = '';
  response!:LoginResponseDto

    ngOnInit() {
    this.loginForm= new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    passwordHash:new FormControl('',[Validators.required,Validators.minLength(6),Validators.maxLength(15)]), 
  })
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
  
    this.isSubmitting = true;
    const v = this.loginForm.getRawValue()
  
    const dtoToServer: LoginRequest = {
      UserName: v.email,
      Password: v.passwordHash,
    };
  
    this.authServ.loginUser(dtoToServer).subscribe({
      next: () => {
          this.msg.add({ severity: 'success', summary: 'Success', detail: 'User login successfully!' });
          this.loginForm.reset();
          
          const role = this.authServ.getRole();
          
          if (role === 'admin') {
            this.router.navigateByUrl('/manager/gifts');
          } else if (role === 'user') {
            this.router.navigateByUrl('/user/products');
          } else {
            this.router.navigate(['/login']);
          }
      },
      error: (err) => {
        const serverMsg =err?.error?.message ??(typeof err?.error === 'string' ? err.error : null) ??'Login failed';
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


