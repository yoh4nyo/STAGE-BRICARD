import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../app/service/auth.service'; // Ajustez le chemin

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true; // Autorisé si l'utilisateur est admin
  } else {
    // Non autorisé: rediriger vers une page (login, accueil, ou non autorisé)
    console.warn('Accès refusé : droits admin requis.');
    router.navigate(['/login']); // Ou '/unauthorized' ou '/home'
    return false;
  }
};