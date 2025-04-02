import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs'; // Importer Subscription

@Component({
  selector: 'app-dashboard-admin',
  standalone: true, // Assurez-vous que c'est le cas si vous n'avez pas de module dédié
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  users: User[] | null = null; // Initialiser à null pour mieux gérer l'état initial
  isLoading: boolean = false; // Indicateur de chargement
  errorMessage: string | null = null;
  private usersSubscription: Subscription | null = null; // Utiliser Subscription et initialiser à null
  private updateSubscription: Subscription | null = null; // Pour gérer les désabonnements des mises à jour


  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true; // Début du chargement
    this.errorMessage = null; // Réinitialiser l'erreur
    this.users = null; // Réinitialiser les users pour afficher le chargement

    // Annuler la souscription précédente si elle existe
    this.usersSubscription = this.authService.getUsers().subscribe({
      // Change the parameter name to 'response' or something similar to avoid confusion
      // Also, adjust the type hint if possible, or use 'any' if the structure isn't guaranteed
      next: ( users: User[] ) => { // Ou next: (response: any) => {
        // Assign the array inside the 'users' property of the response
        this.users = users;
        this.isLoading = false; // Fin du chargement (succès)
        console.log('Utilisateurs réellement assignés à this.users:', this.users); // Nouveau log pour vérifier
      },
      error: (error: HttpErrorResponse) => {
        // ... (votre gestion d'erreur reste la même)
        this.errorMessage = error.error?.message || error.message || 'Une erreur est survenue lors de la récupération des utilisateurs.';
        this.isLoading = false;
        this.users = []; // Garder [] ou null selon la préférence en cas d'erreur
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      }
    });
  }

  ngOnDestroy(): void {
    // Se désabonner de toutes les souscriptions actives
    this.usersSubscription?.unsubscribe();
    this.updateSubscription?.unsubscribe();
  }

  updateUserRole(userId: number, newRole: string): void {
    this.errorMessage = null; // Reset error on new action
    // Annuler la souscription de mise à jour précédente
    this.updateSubscription?.unsubscribe();

    this.updateSubscription = this.authService.updateRole(userId, newRole).subscribe({
      next: (updatedUser) => {
        console.log('Rôle utilisateur mis à jour :', updatedUser);
        const index = this.users?.findIndex(u => u.id === userId); // Utiliser optional chaining au cas où users est null
        if (this.users && index !== -1) {
          // Créer une nouvelle référence de tableau pour la détection de changement (bonne pratique)
          const newUsers = [...this.users];
          if (index !== undefined && index !== -1) {
            newUsers[index] = updatedUser;
          }
          this.users = newUsers;
          // Alternative simple si la détection de changement fonctionne bien:
          // this.users[index] = updatedUser;
        } else {
          // Peut-être recharger la liste si l'utilisateur n'a pas été trouvé (cas étrange)
          this.loadUsers();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || error.message || 'Erreur lors de la mise à jour du rôle.';
        console.error('Erreur mise à jour rôle:', error);
      }
    });
  }

  deactivateUser(userId: number): void {
    this.errorMessage = null; // Reset error on new action
     // Annuler la souscription de mise à jour précédente
    this.updateSubscription?.unsubscribe();

    this.updateSubscription = this.authService.updateUser(userId, { isActive: 0 }).subscribe({
       next: (updatedUser) => {
         console.log('Utilisateur désactivé :', updatedUser);
         const index = this.users?.findIndex(u => u.id === userId); // Optional chaining
         if (this.users && index !== -1) {
           // Mettre à jour l'état local
           const newUsers = [...this.users];
           if (index !== undefined && index !== -1) {
             newUsers[index] = updatedUser; // Ou utiliser directement l'objet retourné par l'API
           }
           // Si l'API ne retourne pas l'utilisateur complet mais juste un succès,
           // on pourrait vouloir le filtrer ou le marquer comme inactif
           // Exemple si l'API retourne juste un statut 200 OK:
           // newUsers[index].isActive = 0; // Mettre à jour la propriété locale
           this.users = newUsers;

           // Optionnel : si vous voulez masquer immédiatement les utilisateurs désactivés
           // this.users = this.users.filter(u => u.id !== userId); // ou u.isActive !== 0
         } else {
            this.loadUsers(); // Recharger si non trouvé
         }
       },
       error: (error: HttpErrorResponse) => {
         this.errorMessage = error.error?.message || error.message || 'Erreur lors de la désactivation de l\'utilisateur.';
         console.error('Erreur désactivation:', error);
       }
     });
  }

  // Méthode appelée par le bouton de déconnexion
  logout(): void {
    this.authService.logout();
    // Naviguer vers la page de connexion si nécessaire (souvent géré dans le service logout)
  }
}