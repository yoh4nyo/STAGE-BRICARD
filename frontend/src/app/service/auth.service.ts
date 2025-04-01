import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// Imports RxJS nécessaires
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
// Import pour la navigation
import { Router } from '@angular/router';

// Interface pour l'utilisateur (déjà bonne !)
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'client' | string; // Type plus précis si possible ('admin' | 'client')
  firstName: string;
  lastName: string;
}

// Interface pour la réponse de login (déjà bonne !)
export interface LoginResponse {
  message: string;
  user: User; // L'API doit renvoyer l'objet User complet avec le rôle
  // token?: string; // Prêt si vous ajoutez JWT
}

// Interface pour les credentials de login
export interface AuthCredentials {
  email: string;
  password?: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api'; // Adaptez si nécessaire

  // V-- BehaviorSubject pour gérer l'état de l'utilisateur connecté --V
  // Initialisé avec l'utilisateur potentiellement stocké dans localStorage
  private userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  // Observable public pour que les composants s'y abonnent
  currentUser$ = this.userSubject.asObservable();

  // V-- Injection de Router pour la navigation --V
  constructor(private http: HttpClient, private router: Router) { }

  // --- Méthode pour récupérer l'utilisateur actuel (instantané) ---
  getCurrentUserSnapshot(): User | null {
    return this.userSubject.getValue();
  }

  // --- Méthode pour la connexion ---
  login(credentials: AuthCredentials): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/login`;
    console.log('Tentative de connexion via le service pour:', credentials.email);

    return this.http.post<LoginResponse>(loginUrl, credentials)
      .pipe(
        tap(response => {
          console.log('Réponse du login service:', response);
          if (response && response.user) {
             // V-- Stocker l'utilisateur et émettre la nouvelle valeur --V
            this.storeUserData(response.user); // Sauvegarde dans localStorage
            this.userSubject.next(response.user); // Met à jour le BehaviorSubject
            console.log('Utilisateur connecté et rôle stocké:', response.user.role);
          } else {
            // Gérer le cas où la réponse n'est pas valide (rare si le backend est correct)
             console.error("Réponse de login invalide ou utilisateur manquant", response);
             this.handleLogoutInternal(); // Déconnecter en cas de réponse invalide
          }
        }),
        catchError(this.handleError) // Gestion des erreurs HTTP
      );
  }

   // --- Méthode pour l'inscription (inchangée) ---
   register(userData: any): Observable<any> {
    const registerUrl = `${this.apiUrl}/users`;
    return this.http.post<any>(registerUrl, userData)
      .pipe(
        tap(response => console.log('Réponse de l\'inscription:', response)),
        catchError(this.handleError)
      );
   }


  // --- Stockage des données utilisateur (inchangé) ---
  private storeUserData(user: User) {
    try {
       localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
       console.error("Erreur lors de la sauvegarde dans localStorage", e);
    }
  }

  // --- Chargement initial depuis localStorage (anciennement partie de getCurrentUser) ---
  private loadUserFromStorage(): User | null {
     try {
        const userString = localStorage.getItem('currentUser');
        return userString ? JSON.parse(userString) : null;
     } catch (e) {
        console.error("Erreur lors du chargement depuis localStorage", e);
        localStorage.removeItem('currentUser'); // Nettoyer si corrompu
        return null;
     }
  }

  // --- Déconnexion (publique) ---
  logout() {
     this.handleLogoutInternal();
     this.router.navigate(['/login']); // Rediriger l'utilisateur
  }

  // --- Logique interne de déconnexion ---
  private handleLogoutInternal() {
     localStorage.removeItem('currentUser');
     this.userSubject.next(null); // Émettre null pour notifier la déconnexion
     console.log('Utilisateur déconnecté');
  }

  // V-- Méthodes utilitaires pour vérifier le rôle et l'état --V
  isLoggedIn(): boolean {
     // Vérifie simplement si un utilisateur est dans le BehaviorSubject
     return !!this.userSubject.getValue();
     // Alternativement, si vous avez un token: return !!this.userSubject.getValue()?.token;
  }

  isAdmin(): boolean {
    const user = this.userSubject.getValue();
    // Vérifie si l'utilisateur existe ET si son rôle est 'admin' (insensible à la casse pour plus de robustesse)
    return !!user && user.role?.toLowerCase() === 'admin';
  }

  isClient(): boolean {
    const user = this.userSubject.getValue();
    // Vérifie si l'utilisateur existe ET si son rôle est 'client'
    return !!user && user.role?.toLowerCase() === 'client';
  }
  // --- Fin des méthodes utilitaires ---


  // --- Gestionnaire d'erreurs (inchangé mais toujours utile) ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
       console.error(
         `Code d'erreur backend ${error.status}, ` +
         `Corps: ${JSON.stringify(error.error)}`);
       // Essayer d'utiliser le message du backend ou un message par défaut
       errorMessage = error.error?.message || `Erreur serveur (${error.status})`;
       if (error.status === 401) { // Erreur d'authentification spécifique
          errorMessage = "Email ou mot de passe incorrect.";
       }
    }
    console.error(errorMessage);
    // Renvoyer l'erreur pour que le composant puisse aussi réagir
    return throwError(() => new Error(errorMessage));
  }
}