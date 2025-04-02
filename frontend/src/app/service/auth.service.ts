import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // map est déjà importé, c'est bon
import { Router } from '@angular/router';

// Interface pour l'utilisateur (inchangée)
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'client' | string;
  isActive: number; // 1 pour actif, 0 pour inactif // Garder number si l'API renvoie 0/1
  // Si l'API renvoyait true/false, il faudrait : isActive: boolean;
  firstName: string;
  lastName: string;
}

// Interface pour la réponse de login (inchangée)
export interface LoginResponse {
  message: string;
  user: User;
}

// Interface pour les credentials de login (inchangée)
export interface AuthCredentials {
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // --- Correction ici ---
  getUsers(): Observable<User[]> {
    // 1. Typage de http.get pour correspondre à la réponse réelle de l'API: { users: User[] }
    // 2. Utilisation de pipe(map(...)) pour extraire le tableau response.users
    // 3. Ajout de catchError pour la cohérence
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`) // Utiliser apiUrl
      .pipe(
        map(response => response.users), // Extrait le tableau du wrapper { users: [...] }
        catchError(this.handleError) // Applique la gestion d'erreur existante
      );
  }
  // --- Fin de la correction ---


  // Méthode updateUser légèrement ajustée (utilisation de apiUrl et PATCH suggéré)
  updateUser(userId: number, updateData: { isActive: number }): Observable<User> {
    // Utilise PATCH car c'est une mise à jour partielle. Remettre PUT si le backend ne supporte que ça.
    // S'assurer que l'API retourne l'objet User mis à jour.
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, updateData)
      .pipe(catchError(this.handleError));
  }

  private apiUrl = 'http://localhost:3001/api'; // Assurez-vous que c'est la bonne base
  private userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  getCurrentUserSnapshot(): User | null {
    return this.userSubject.getValue();
  }

  // Méthode updateRole légèrement ajustée (utilisation de apiUrl et PATCH suggéré)
  updateRole(userId: number, newRole: string): Observable<User> {
    // Utilise PATCH car c'est une mise à jour partielle.
    // S'assurer que l'API retourne l'objet User mis à jour.
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, { role: newRole })
     .pipe(catchError(this.handleError));
  }

  // --- Méthode pour la connexion (inchangée) ---
  login(credentials: AuthCredentials): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/login`;
    console.log('Tentative de connexion via le service pour:', credentials.email);

    return this.http.post<LoginResponse>(loginUrl, credentials)
      .pipe(
        tap(response => {
          console.log('Réponse du login service:', response);
          if (response && response.user) {
            this.storeUserData(response.user);
            this.userSubject.next(response.user);
            console.log('Utilisateur connecté et rôle stocké:', response.user.role);
          } else {
             console.error("Réponse de login invalide ou utilisateur manquant", response);
             this.handleLogoutInternal();
          }
        }),
        catchError(this.handleError)
      );
  }

   // --- Méthode pour l'inscription (inchangée) ---
   register(userData: any): Observable<any> {
    const registerUrl = `${this.apiUrl}/users`; // Utilisation de apiUrl
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

  // --- Chargement initial depuis localStorage (inchangé) ---
  private loadUserFromStorage(): User | null {
     try {
        const userString = localStorage.getItem('currentUser');
        return userString ? JSON.parse(userString) : null;
     } catch (e) {
        console.error("Erreur lors du chargement depuis localStorage", e);
        localStorage.removeItem('currentUser');
        return null;
     }
  }

  // --- Déconnexion (publique) (inchangée) ---
  logout() {
     this.handleLogoutInternal();
     this.router.navigate(['/login']);
  }

  // --- Logique interne de déconnexion (inchangée) ---
  private handleLogoutInternal() {
     localStorage.removeItem('currentUser');
     this.userSubject.next(null);
     console.log('Utilisateur déconnecté');
  }

  // --- Méthodes utilitaires pour vérifier le rôle et l'état (inchangées) ---
  isLoggedIn(): boolean {
     return !!this.userSubject.getValue();
  }

  isAdmin(): boolean {
    const user = this.userSubject.getValue();
    return !!user && user.role?.toLowerCase() === 'admin';
  }

  isClient(): boolean {
    const user = this.userSubject.getValue();
    return !!user && user.role?.toLowerCase() === 'client';
  }

  // --- Gestionnaire d'erreurs (inchangé) ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
       console.error(
         `Code d'erreur backend ${error.status}, ` +
         `Corps: ${JSON.stringify(error.error)}`);
       errorMessage = error.error?.message || `Erreur serveur (${error.status})`;
       if (error.status === 401) {
          errorMessage = "Email ou mot de passe incorrect.";
       }
       // Tu pourrais ajouter d'autres codes d'erreur ici (403 Forbidden, etc.)
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}