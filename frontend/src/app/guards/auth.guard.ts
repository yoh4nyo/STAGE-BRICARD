import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../service/auth.service'; // Adapte le chemin

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot, // Ajoute ces deux paramètres
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const user = this.authService.getCurrentUserSnapshot();
    const expectedRoles = route.data['roles'] as string[]; // Récupère les rôles attendus depuis les données de la route

    if (user) {
      // Vérifie si l'utilisateur a l'un des rôles requis
      if (expectedRoles && !expectedRoles.includes(user.role)) {
        console.log(`AuthGuard: Accès refusé, rôle requis: ${expectedRoles}, rôle utilisateur: ${user.role}`);
        // Redirige vers une page d'accès non autorisé ou la page de connexion
        return this.router.createUrlTree(['/login']); // Ou /login
      }
      return true; // Autorise l'accès si l'utilisateur a le bon rôle
    } else {
      console.log('AuthGuard: Accès refusé (utilisateur non connecté), redirection vers /login');
      return this.router.createUrlTree(['/login']);
    }
  }
}
