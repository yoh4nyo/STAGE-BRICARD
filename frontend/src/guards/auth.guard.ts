import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../app/service/auth.service'; // Ajustez le chemin

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Autorisé si connecté
  } else {
    router.navigate(['/login']); // Rediriger vers login si non connecté
    return false;
  }
};