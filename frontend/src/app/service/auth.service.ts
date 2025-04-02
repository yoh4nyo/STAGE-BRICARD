// src/app/service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';

// --- Interfaces (inchangées) ---
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'client' | string;
  isActive: boolean; // On va supposer que l'API renvoie bien un booléen maintenant
                     // Si elle renvoie 0/1, garde : isActive: number;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string; // <-- Ajout du champ token ici !
}

export interface AuthCredentials {
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // --- URL API (inchangée) ---
  private apiUrl = 'http://localhost:3001/api'; // Assure-toi que c'est correct

  // --- User State (inchangé) ---
  private userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  // --- Méthode Login MISE À JOUR ---
  login(credentials: AuthCredentials): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/login`;
    console.log('AuthService: Tentative de connexion pour:', credentials.email);

    return this.http.post<LoginResponse>(loginUrl, credentials) // Attend une LoginResponse
      .pipe(
        tap(response => {
          console.log('AuthService: Réponse du login:', response);
          // Vérifier si la réponse contient bien l'utilisateur ET le token
          if (response && response.user && response.token) {
            // 1. Stocker le token dans localStorage
            localStorage.setItem('authToken', response.token); // Clé 'authToken' (ou autre nom)
            console.log('AuthService: Token stocké.');

            // 2. Stocker les infos utilisateur (comme avant)
            this.storeUserData(response.user);

            // 3. Mettre à jour le sujet BehaviorSubject (comme avant)
            this.userSubject.next(response.user);
            console.log('AuthService: Utilisateur connecté et rôle stocké:', response.user.role);
          } else {
            console.error("AuthService: Réponse de login invalide (manque user ou token)", response);
            // En cas de réponse invalide du backend, on déconnecte par sécurité
            this.handleLogoutInternal();
            // Optionnel: lancer une erreur pour que le composant puisse la gérer
            // throw new Error("Réponse de connexion invalide du serveur.");
          }
        }),
        // Laisser catchError gérer les erreurs HTTP (401, 500 etc.)
        catchError(error => this.handleAuthError(error)) // Utiliser une fonction dédiée pour plus de clarté
      );
  }

  // --- Méthode Logout MISE À JOUR ---
  logout(): void {
    console.log('AuthService: Déconnexion demandée.');
    // 1. Supprimer le token du localStorage
    localStorage.removeItem('authToken');
    console.log('AuthService: Token supprimé.');

    // 2. Exécuter la logique interne de déconnexion (supprimer user, notifier)
    this.handleLogoutInternal();

    // 3. Rediriger vers la page de login (comme avant)
    this.router.navigate(['/login']);
  }

  // --- Nouvelle méthode HELPER pour récupérer le token ---
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // --- Méthodes utilitaires (mise à jour de isLoggedIn) ---
  isLoggedIn(): boolean {
    // La présence d'un token est un meilleur indicateur de connexion
    return !!this.getToken();
    // Ou garder l'ancienne logique si tu préfères: return !!this.userSubject.getValue();
  }

  isAdmin(): boolean { // Inchangé
    const user = this.userSubject.getValue();
    return !!user && user.role?.toLowerCase() === 'admin';
  }

   isClient(): boolean { // Inchangé
    const user = this.userSubject.getValue();
    return !!user && user.role?.toLowerCase() === 'client';
  }

  // --- Méthodes de l'API (getUsers, updateUser, updateRole, register) ---
  // IMPORTANT: Ces méthodes vont maintenant être interceptées pour ajouter le token
  // Pas besoin de les modifier ici, sauf si tu veux adapter les types de retour
  // ou la gestion d'erreur spécifique à ces appels.

  getUsers(): Observable<User[]> { // Attend un objet { users: [...] }
    // L'intercepteur ajoutera le token
    // REMARQUE: Si le backend renvoie { users: [...] }, le type ici est correct.
    // Si tu avais appliqué le 'map' dans le service AVANT, alors le type serait Observable<User[]>
    // Vérifie la réponse réelle de ton API GET /users
     return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`)
        .pipe(
          map(response => response.users), // On extrait le tableau d'utilisateurs
          catchError(error => this.handleApiError(error))); // Gestion erreur générique API
  }

  updateUser(userId: number, updateData: { isActive: boolean | number }): Observable<User> {
     // Adapter isActive pour envoyer 0 ou 1 si l'API attend ça
     const dataToSend = { isActive: updateData.isActive ? 1 : 0 };
     return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, dataToSend)
         .pipe(catchError(error => this.handleApiError(error)));
   }

   updateRole(userId: number, newRole: string): Observable<User> {
     return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, { role: newRole })
         .pipe(catchError(error => this.handleApiError(error)));
   }

   register(userData: any): Observable<any> { // Route publique, pas besoin de token
     const registerUrl = `${this.apiUrl}/users`; // Est-ce correct ? Ou /register ?
     // Si /users est protégé, l'inscription doit se faire via une autre route ou sans token
     return this.http.post<any>(registerUrl, userData)
       .pipe(catchError(error => this.handleApiError(error)));
   }


  // --- Méthodes internes (stockage, chargement, déconnexion) ---
  private storeUserData(user: User) { // Inchangé
    try {
       localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) { console.error("LocalStorage store error", e); }
  }

  private loadUserFromStorage(): User | null { // Inchangé
     try {
        const userString = localStorage.getItem('currentUser');
        return userString ? JSON.parse(userString) : null;
     } catch (e) {
        console.error("LocalStorage load error", e);
        localStorage.removeItem('currentUser'); // Nettoyer si corrompu
        localStorage.removeItem('authToken'); // Nettoyer token aussi par sécurité
        return null;
     }
  }

  private handleLogoutInternal() { // Inchangé
     localStorage.removeItem('currentUser');
     this.userSubject.next(null);
     console.log('AuthService: User data cleared.');
  }


  // --- Gestionnaires d'erreurs (séparés pour clarté) ---
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erreur d\'authentification';
    if (error.status === 401 || error.status === 403) {
        // Message spécifique du backend si disponible, sinon message générique
        errorMessage = error.error?.message || "Identifiants incorrects ou compte désactivé.";
        // On ne déconnecte PAS automatiquement ici, le composant peut vouloir afficher l'erreur
    } else {
        errorMessage = error.error?.message || `Erreur serveur (${error.status})`;
    }
     console.error(`AuthService Auth Error (${error.status}): ${errorMessage}`, error.error);
    // Renvoyer l'erreur pour que le composant la gère (afficher le message)
    return throwError(() => new Error(errorMessage));
  }

  private handleApiError(error: HttpErrorResponse): Observable<never> {
      // Gestion spécifique si token invalide/expiré reçu sur appel API normal
       if (error.status === 401 || error.status === 403) {
           console.warn(`AuthService API Error (${error.status}): Token invalide/expiré ou droits insuffisants. Déconnexion.`);
           // Si on reçoit 401/403 sur une API protégée, c'est souvent que le token n'est plus bon
           this.logout(); // Déconnecter l'utilisateur et rediriger
           return throwError(() => new Error("Session expirée ou invalide. Veuillez vous reconnecter."));
       }

       // Gestion des autres erreurs API (404, 500, etc.)
       let errorMessage = error.error?.message || `Erreur API (${error.status})`;
       console.error(`AuthService API Error (${error.status}): ${errorMessage}`, error.error);
       return throwError(() => new Error(errorMessage)); // Renvoyer l'erreur pour le composant
   }

  // Snapshot (inchangé)
  getCurrentUserSnapshot(): User | null {
    return this.userSubject.getValue();
  }
}