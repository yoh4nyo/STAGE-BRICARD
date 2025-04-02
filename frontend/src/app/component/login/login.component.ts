import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs'; 
import { AuthService, AuthCredentials } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, OnDestroy { 
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  private loginSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {}



  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) {
        return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const credentials: AuthCredentials = this.loginForm.value;

    this.loginSubscription?.unsubscribe();

    // Appelle la méthode login du service
    this.loginSubscription = this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('LoginComponent: Connexion réussie ! Réponse:', response);
        if (response.user.role === 'client') {
          this.router.navigate(['/dashboard-client']);
        } else if (response.user.role === 'admin') {
          this.router.navigate(['/dashboard-admin']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        // L'erreur est déjà formatée par le service
        this.errorMessage = error.message || 'Échec de la connexion.';
        console.error('LoginComponent: Erreur de connexion:', error);
      }
    });
  }

  ngOnDestroy(): void {
      this.loginSubscription?.unsubscribe();
  }
}