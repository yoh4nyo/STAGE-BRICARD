// src/app/service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http'; // Importer HttpHeaders si l'intercepteur n'est pas utilisé
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // <<-- Installer: npm install jwt-decode

// --- Interfaces ---
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'client'; // Gardons les rôles stricts si possible
  isActive: boolean | number; // Permettre les deux types pour flexibilité
  firstName: string;
  lastName: string;
  password?: string; // Seulement pour la création
}

export interface LoginResponse {
  message: string;
  user: User; // User contient maintenant isActive en boolean ou number
  token: string;
}

// Interface pour le payload JWT décodé (ajuster selon ce que ton backend met dedans)
interface DecodedToken {
    id: number;
    role: string;
    // Ajouter d'autres champs si présents (iat, exp, etc.)
    [key: string]: any; // Pour d'autres propriétés éventuelles
}

export interface AuthCredentials {
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api'; // Vérifie ce port/URL
  private userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  // --- Login (inchangé, mais vérifie l'interface User) ---
  login(credentials: AuthCredentials): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/login`;
    return this.http.post<LoginResponse>(loginUrl, credentials)
      .pipe(
        tap(response => {
          if (response && response.user && response.token) {
            localStorage.setItem('authToken', response.token);
            // Convertir isActive en boolean si reçu comme 0/1 avant stockage
            const userToStore = {
                ...response.user,
                isActive: !!response.user.isActive // Force la conversion en boolean
            };
            this.storeUserData(userToStore);
            this.userSubject.next(userToStore);
            console.log('AuthService: Connexion réussie, token et user stockés.');
          } else {
            console.error("AuthService: Réponse de login invalide", response);
            this.handleLogoutInternal(); // Déconnexion par sécurité
            throw new Error("Réponse de connexion invalide du serveur."); // Lève une erreur
          }
        }),
        catchError(error => this.handleAuthError(error))
      );
  }

  // --- Logout (inchangé) ---
  logout(): void {
    console.log('AuthService: Déconnexion.');
    localStorage.removeItem('authToken');
    this.handleLogoutInternal();
    this.router.navigate(['/login']);
  }

  // --- Token Methods ---
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // --- Nouvelle méthode pour obtenir les infos du token ---
  getUserInfoFromToken(): { id: number; role: string } | null {
      const token = this.getToken();
      if (!token) {
          return null;
      }
      try {
          const decoded = jwtDecode<DecodedToken>(token);
          // Assure-toi que les propriétés 'id' et 'role' existent dans ton token
          if (decoded && typeof decoded.id === 'number' && typeof decoded.role === 'string') {
              return { id: decoded.id, role: decoded.role };
          }
          console.error("Token décodé invalide ou ne contient pas id/role:", decoded);
          return null;
      } catch (error) {
          console.error("Erreur lors du décodage du token:", error);
          // Si le token est invalide, on pourrait vouloir déconnecter l'utilisateur
          // this.logout();
          return null;
      }
  }


  // --- User State Info ---
  isLoggedIn(): boolean {
    return !!this.getToken(); // Basé sur la présence du token
  }

  isAdmin(): boolean {
    // Utiliser l'info du token si possible (plus fiable après rechargement)
     const tokenInfo = this.getUserInfoFromToken();
     if (tokenInfo) {
         return tokenInfo.role?.toLowerCase() === 'admin';
     }
     // Fallback sur l'état local (moins fiable si page rechargée sans state préservé)
    // const user = this.userSubject.getValue();
    // return !!user && user.role?.toLowerCase() === 'admin';
    return false; // Ou retourner false si token invalide/absent
  }

  isClient(): boolean { // Inchangé pour l'instant
    const user = this.userSubject.getValue();
    return !!user && user.role?.toLowerCase() === 'client';
  }

  getCurrentUserSnapshot(): User | null { // Inchangé
    return this.userSubject.getValue();
  }


  // --- API Calls (CRUD Utilisateurs) ---

  // GET all users (Admin)
  getUsers(): Observable<User[]> {
    // L'intercepteur ajoute le token
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`) // Attend {users: [...]}
        .pipe(
          map(response => response.users.map(user => ({ // Extrait ET convertit isActive en boolean
              ...user,
              isActive: !!user.isActive
          }))),
          catchError(error => this.handleApiError(error))
        );
  }

  // POST create user (Admin)
  createUser(userData: User): Observable<User> { // userData doit inclure le password
    // L'intercepteur ajoute le token
    return this.http.post<{ message: string, user: User }>(`${this.apiUrl}/users`, userData)
      .pipe(
        map(response => ({ // Extrait ET convertit isActive en boolean
            ...response.user,
            isActive: !!response.user.isActive
        })),
        catchError(error => this.handleApiError(error))
      );
  }

  // PATCH update user (Admin)
  // Accepte n'importe quelle partie de User (sauf id et password peut-être)
  updateUser(userId: number, updateData: Partial<User>): Observable<User> {
    // L'intercepteur ajoute le token
    const dataToSend = { ...updateData }; // Copie pour modification

    // Convertir isActive en 0/1 si besoin pour l'API backend
    if (dataToSend.hasOwnProperty('isActive')) {
        dataToSend.isActive = dataToSend.isActive ? 1 : 0;
    }
     // On ne devrait pas envoyer le mot de passe dans une mise à jour partielle
     delete dataToSend.password;
     // L'ID est dans l'URL, pas dans le body
     delete dataToSend.id;

    return this.http.patch<{ message: string, user: User }>(`${this.apiUrl}/users/${userId}`, dataToSend)
        .pipe(
          map(response => ({ // Extrait ET convertit isActive en boolean
              ...response.user,
              isActive: !!response.user.isActive
          })),
          catchError(error => this.handleApiError(error))
        );
  }

  // DELETE user (Admin)
  deleteUser(userId: number): Observable<void> { // Attend 200 OK ou 204 No Content
    // L'intercepteur ajoute le token
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`) // Utiliser <void> si l'API renvoie 204
      .pipe(catchError(error => this.handleApiError(error)));
      // Si l'API renvoie { message: "..." }, utiliser .delete<{ message: string }>(...)
  }


  // --- Méthodes internes (Stockage, Déconnexion) ---
  private storeUserData(user: User) {
    try {
      // Assurer que isActive est boolean avant stockage
      const userToStore = {...user, isActive: !!user.isActive };
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
    } catch (e) { console.error("LocalStorage store error", e); }
  }

  private loadUserFromStorage(): User | null {
     try {
        const userString = localStorage.getItem('currentUser');
        if (!userString) return null;
        const user = JSON.parse(userString) as User;
        // Assurer que isActive est boolean après chargement
        user.isActive = !!user.isActive;
        return user;
     } catch (e) {
        console.error("LocalStorage load error", e);
        this.handleLogoutInternal(); // Nettoyer si corrompu
        return null;
     }
  }

  private handleLogoutInternal() {
     localStorage.removeItem('currentUser');
     localStorage.removeItem('authToken'); // Assurer la suppression du token aussi
     this.userSubject.next(null);
     console.log('AuthService: User data and token cleared.');
  }

  // --- Gestionnaires d'erreurs ---
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    // ... (Gestion spécifique aux erreurs login/auth, inchangée) ...
    let errorMessage = 'Erreur d\'authentification';
    if (error.status === 401 || error.status === 403) {
        errorMessage = error.error?.message || "Identifiants incorrects ou compte désactivé.";
    } else {
        errorMessage = error.error?.message || `Erreur serveur (${error.status})`;
    }
     console.error(`AuthService Auth Error (${error.status}): ${errorMessage}`, error.error);
    return throwError(() => new Error(errorMessage)); // Renvoyer l'erreur pour le composant
  }

  private handleApiError(error: HttpErrorResponse): Observable<never> {
    // ... (Gestion spécifique aux erreurs API après login, inchangée) ...
       if (error.status === 401 ) { // || error.status === 403 si 403 signifie aussi token invalide
           console.warn(`AuthService API Error (${error.status}): Token invalide/expiré. Déconnexion.`);
           this.logout(); // Déconnecter l'utilisateur
           return throwError(() => new Error("Session expirée ou invalide. Veuillez vous reconnecter."));
       }
       // Gérer 403 (Forbidden) comme une erreur de droits sans déconnecter ?
       if (error.status === 403) {
           console.warn(`AuthService API Error (${error.status}): Accès refusé (droits insuffisants).`);
            return throwError(() => new Error(error.error?.message || "Accès refusé. Vous n'avez pas les droits nécessaires."));
       }

       // Autres erreurs API
       let errorMessage = error.error?.message || `Erreur API (${error.status})`;
       console.error(`AuthService API Error (${error.status}): ${errorMessage}`, error.error);
       return throwError(() => new Error(errorMessage));
   }

    // --- Suppression de méthodes redondantes ---
    // La méthode updateRole n'est plus nécessaire si updateUser gère le rôle.
    // La méthode register est remplacée par createUser si c'est pour l'admin.
    // Garder register si c'est une inscription publique distincte.
}