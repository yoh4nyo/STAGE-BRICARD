import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse // <-- Importer HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // <-- Importer throwError
import { catchError } from 'rxjs/operators'; // <-- Importer catchError
import { AuthService } from './auth.service'; // <-- Importer AuthService (Vérifie que ce chemin est correct !)

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Injecter AuthService pour accéder au token et à la méthode logout
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Récupérer le token d'authentification
    const authToken = this.authService.getToken();

    // 2. Cloner la requête pour y ajouter l'en-tête d'autorisation
    //    SI un token existe ET SI la requête est destinée à notre API
    const apiUrl = 'http://localhost:3001/api'; // Adapte si ton URL API de base est différente
    if (authToken && request.url.startsWith(apiUrl)) {
      // Cloner la requête et ajouter l'en-tête
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
       console.log('AuthInterceptor: Ajout du header Authorization pour', request.url);
      // Passer la requête clonée avec l'en-tête au handler suivant
      // Et ajouter la gestion d'erreur 401/403 ici aussi !
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
           if (error.status === 401 || error.status === 403) {
              console.warn('AuthInterceptor: Erreur 401/403 détectée, déconnexion auto.', error.message);
              // Token invalide/expiré ou droits insuffisants -> Déconnexion
              this.authService.logout(); // Appelle la méthode logout du service
           }
           // Renvoyer l'erreur pour que le service/composant puisse aussi réagir si besoin
           return throwError(() => error);
        })
      );
    }

    // 3. Si pas de token ou requête externe, passer la requête originale
    return next.handle(request);
  }
}