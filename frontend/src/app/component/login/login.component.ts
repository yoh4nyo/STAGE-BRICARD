import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms'; // Ou ReactiveFormsModule si vous utilisez des formulaires réactifs
import { Router } from '@angular/router'; // Pour la redirection après connexion
import { AuthService, LoginResponse } from '../../service/auth.service'; // Ajustez le chemin d'import

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [FormsModule], // Si vous utilisez des formulaires réactifs, sinon retirez cette ligne
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isLoading = false; // Pour afficher un indicateur de chargement
  errorMessage: string | null = null; // Pour afficher les erreurs

  // Injectez AuthService et Router
  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm) { // Type NgForm si vous utilisez Template-driven forms
    if (!form.valid) {
      return; // Ne rien faire si le formulaire n'est pas valide
    }

    this.isLoading = true;
    this.errorMessage = null;
    const email = form.value.email; // Récupère la valeur du champ nommé 'email'
    const password = form.value.password; // Récupère la valeur du champ nommé 'password'

    // Appelle la méthode login du service
    // Important: il faut s'abonner (subscribe) pour que l'appel soit effectué !
    this.authService.login({ email, password }).subscribe({
      next: (response: LoginResponse) => {
        // --- Succès ---
        this.isLoading = false;
        console.log('Connexion réussie depuis le composant !', response);
        // Rediriger vers une page protégée (ex: tableau de bord)
        this.router.navigate(['/dashboard']); // Assurez-vous que '/dashboard' est une route définie
      },
      error: (error) => {
        // --- Erreur ---
        this.isLoading = false;
        this.errorMessage = error.message || 'Échec de la connexion. Vérifiez vos identifiants.'; // Affiche l'erreur renvoyée par handleError
        console.error('Erreur de connexion depuis le composant:', error);
      }
    });

    // form.reset(); // Vous pouvez réinitialiser le formulaire ici si vous le souhaitez
  }
}