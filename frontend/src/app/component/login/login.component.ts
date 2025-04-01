import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../service/auth.service'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})


export class LoginComponent implements OnInit {

  // V-- Déclarer la propriété attendue par le template --V
  loginForm!: FormGroup; // Utiliser '!' ou initialiser dans le constructeur/ngOnInit

  isLoading = false;
  errorMessage: string | null = null;

  // V-- Injecter FormBuilder en plus des autres services --V
  constructor(
    private fb: FormBuilder, // Injecter FormBuilder
    private authService: AuthService,
    private router: Router
  ) {}

  // V-- Initialiser le formulaire dans ngOnInit --V
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      // Les clés ('email', 'password') correspondent aux formControlName du template
      email: ['', [Validators.required, Validators.email]], // Valeur initiale, validateurs
      password: ['', [Validators.required, Validators.minLength(6)]] // Valeur initiale, validateurs
    });
  }

  // V-- Modifier onSubmit pour utiliser this.loginForm --V
  onSubmit() { // Ne prend plus 'form: NgForm' en argument
    // Vérifier la validité avec le FormGroup de la classe
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // Marque tous les champs pour afficher les erreurs
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Récupérer les valeurs depuis le FormGroup de la classe
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    console.log('Tentative de connexion avec (Reactive Form):', { email, password });

    this.authService.login({ email, password }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        console.log('Connexion réussie !', response);
        // this.router.navigate(['/dashboard']); // Décommentez quand la route existe
      },
      error: (error) => {
        this.isLoading = false;
        // Adaptez le message d'erreur si nécessaire en fonction de la réponse de l'API
        this.errorMessage = error?.error?.message || error?.message || 'Échec de la connexion.';
        console.error('Erreur de connexion:', error);
      }
    });

    // On ne réinitialise généralement pas le formulaire en cas d'échec
    // Si la connexion réussit, la redirection se charge de "nettoyer" la page.
    // Si vous voulez VRAIMENT le réinitialiser : this.loginForm.reset();
  }
}