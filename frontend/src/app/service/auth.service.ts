import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // Pour la gestion des Observables et erreurs
import { catchError, tap } from 'rxjs/operators'; // Opérateurs RxJS utiles

// Optionnel: Définir une interface pour la réponse utilisateur attendue
export interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  // token?: string; // Si vous ajoutez JWT plus tard
}

@Injectable({
  providedIn: 'root' // Service disponible globalement
})
export class AuthService {
  // URL de base de votre API backend
  // ! Mieux: Utiliser les fichiers environment.ts pour cela !
  private apiUrl = 'http://localhost:3001/api'; // Adaptez le port si nécessaire

  constructor(private http: HttpClient) { } // Injection du HttpClient

  // --- Méthode pour la connexion ---
  login(credentials: { email: string, password: string }): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/login`; // URL complète de l'endpoint

    // Optionnel : Définir des headers si nécessaire (souvent pas obligatoire pour Content-Type: application/json avec post d'objet)
    // const httpOptions = {
    //   headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    // };

    console.log('Tentative de connexion via le service pour:', credentials.email);

    // HttpClient.post renvoie un Observable. Le type <LoginResponse> aide avec la typographie.
    return this.http.post<LoginResponse>(loginUrl, credentials /*, httpOptions */)
      .pipe(
        tap(response => {
          // Actions à effectuer en cas de succès (ex: log, stockage local)
          console.log('Réponse du login service:', response);
          this.storeUserData(response.user); // Exemple de fonction pour stocker
        }),
        catchError(this.handleError) // Gestion centralisée des erreurs
      );
  }

   // --- Méthode pour l'inscription (exemple basé sur votre code précédent) ---
   register(userData: any): Observable<any> { // Utiliser un type plus précis si possible
    const registerUrl = `${this.apiUrl}/users`;
    return this.http.post<any>(registerUrl, userData)
      .pipe(
        tap(response => console.log('Réponse de l\'inscription:', response)),
        catchError(this.handleError)
      );
   }


  // --- Stockage des données utilisateur (exemple simple avec localStorage) ---
  private storeUserData(user: User) {
    // Attention: Ne stockez jamais d'infos sensibles comme le mot de passe !
    // Si vous utilisez JWT, vous stockeriez le token ici.
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // --- Récupération des données utilisateur ---
  getCurrentUser(): User | null {
     const userString = localStorage.getItem('currentUser');
     return userString ? JSON.parse(userString) : null;
  }

  // --- Déconnexion ---
  logout() {
    localStorage.removeItem('currentUser');
    // Vous pourriez aussi vouloir notifier d'autres parties de l'app
  }

  // --- Gestionnaire d'erreurs simple ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue!';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'échec
      // error.error peut contenir le corps de la réponse d'erreur du backend
      console.error(
        `Code d'erreur backend ${error.status}, ` +
        `Corps: ${JSON.stringify(error.error)}`);
       errorMessage = error.error?.message || `Erreur serveur (${error.status})`; // Utilise le message du backend si disponible
    }
    console.error(errorMessage);
    // Retourne un observable échouant avec un message d'erreur pour l'utilisateur
    return throwError(() => new Error(errorMessage));
  }
}