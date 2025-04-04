import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms'; // Importer FormsModule
import { AuthService, User } from '../../service/auth.service'; // Adapte le chemin si nécessaire
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ajouter FormsModule ici
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  users: User[] | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null; // Erreur globale (chargement, suppression...)
  loggedInUserId: number | null = null; // **IMPORTANT: À récupérer depuis le service d'authentification**

  // --- États pour les modales ---
  isUserModalOpen: boolean = false;
  isConfirmModalOpen: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentUser: Partial<User> = {}; // Pour le formulaire ajout/modif (utiliser Partial pour flexibilité)
  userToDelete: User | null = null; // Utilisateur ciblé pour suppression
  modalErrorMessage: string | null = null; // Erreur spécifique à la modale
  isSavingUser: boolean = false; // Indicateur de chargement pour sauvegarde (ajout/modif)
  isDeletingUser: boolean = false; // Indicateur de chargement pour suppression

  // --- Souscriptions ---
  private usersSubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null; // Pour toutes les actions (update, delete, create)

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // **IMPORTANT**: Récupérer l'ID de l'utilisateur connecté ici
    // Exemple: this.loggedInUserId = this.authService.getCurrentUserId();
    // Si tu n'as pas la méthode, tu devras la créer dans ton AuthService
    // (elle devrait extraire l'ID du token JWT stocké)
    // Pour l'instant, on simule (NE PAS LAISSER EN PRODUCTION):
    // this.loggedInUserId = 1; // À remplacer par la vraie logique

    // Tentative de récupération sécurisée de l'ID utilisateur
     try {
       const currentUserInfo = this.authService.getUserInfoFromToken(); // Suppose que cette méthode existe
       this.loggedInUserId = currentUserInfo ? currentUserInfo.id : null;
       if (!this.loggedInUserId) {
         console.warn("Impossible de récupérer l'ID de l'utilisateur connecté.");
         // Gérer ce cas ? Rediriger ? Afficher un message ?
         // Pour l'instant, on continue mais certaines fonctionnalités seront limitées.
       }
     } catch (e) {
       console.error("Erreur lors de la récupération des informations utilisateur depuis le token:", e);
       this.errorMessage = "Erreur lors de l'initialisation des informations utilisateur.";
     }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites mémoire
    this.usersSubscription?.unsubscribe();
    this.actionSubscription?.unsubscribe();
  }

  // --- Chargement des utilisateurs ---
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.users = null;
    this.usersSubscription?.unsubscribe(); // Annuler la précédente si existe

    this.usersSubscription = this.authService.getUsers().subscribe({
      next: (fetchedUsers: User[]) => {
        this.users = fetchedUsers;
        this.isLoading = false;
        console.log('Utilisateurs chargés:', this.users);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.formatError(error, 'Une erreur est survenue lors de la récupération des utilisateurs.');
        this.isLoading = false;
        this.users = []; // Ou null, selon préférence
        console.error('Erreur chargement utilisateurs:', error);
      }
    });
  }

  // --- Gestion Modale Ajout/Modification ---
  openUserModal(mode: 'add' | 'edit', user: User | null = null): void {
    this.modalMode = mode;
    this.modalErrorMessage = null;
    this.isSavingUser = false;
    this.isUserModalOpen = true;

    if (mode === 'add') {
      this.currentUser = { role: 'client' }; // Valeurs par défaut pour ajout
    } else if (user) {
      // Copie pour éviter de modifier directement l'objet dans le tableau
      this.currentUser = { ...user };
      delete this.currentUser.password; // Ne pas afficher/modifier le mdp existant
    } else {
        console.error("Tentative d'ouverture de la modale d'édition sans utilisateur fourni.");
        this.closeUserModal(); // Fermer car état invalide
    }
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
    this.currentUser = {}; // Nettoyer
    this.modalErrorMessage = null;
  }

  saveUser(form: NgForm): void {
    if (form.invalid) {
      this.modalErrorMessage = "Veuillez remplir correctement tous les champs requis.";
      // Marquer tous les champs comme "touchés" pour afficher les erreurs partout
      Object.values(form.controls).forEach(control => {
            control.markAsTouched();
      });
      return;
    }

    this.isSavingUser = true;
    this.modalErrorMessage = null;
    const userData = { ...this.currentUser }; // Copie des données du formulaire

    this.actionSubscription?.unsubscribe(); // Annuler action précédente

    let request$;

    if (this.modalMode === 'add') {
      // Validation spécifique pour l'ajout (mot de passe)
      if (!userData.password || userData.password.length < 6) {
        this.modalErrorMessage = "Le mot de passe est requis et doit contenir au moins 6 caractères.";
        this.isSavingUser = false;
        return;
      }
      console.log("Tentative d'ajout utilisateur:", userData);
      // Assurez-vous que votre service a une méthode `createUser`
      request$ = this.authService.createUser(userData as User); // Caster si nécessaire après validation

    } else { // Mode 'edit'
      const userId = userData.id;
      if (!userId) {
        this.modalErrorMessage = "Impossible de modifier : ID utilisateur manquant.";
        this.isSavingUser = false;
        return;
      }
      // Préparer les données à envoyer (sans ID, sans password, sans isActive si géré ailleurs)
      const updateData: Partial<User> = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      };
       console.log(`Tentative de modification utilisateur ID ${userId}:`, updateData);
       // Assurez-vous que updateUser peut prendre ces champs
      request$ = this.authService.updateUser(userId, updateData);
    }

    this.actionSubscription = request$.subscribe({
      next: (responseUser) => {
        console.log('Utilisateur sauvegardé avec succès:', responseUser);
        this.closeUserModal();
        this.loadUsers(); // Recharger la liste complète après ajout/modif
        // TODO: Afficher un message de succès (toast/snackbar)
      },
      error: (error: HttpErrorResponse) => {
        this.modalErrorMessage = this.formatError(error, `Erreur lors de ${this.modalMode === 'add' ? 'l\'ajout' : 'la modification'} de l'utilisateur.`);
        this.isSavingUser = false; // Permettre de réessayer
        console.error('Erreur sauvegarde utilisateur:', error);
      }
    });
  }

  // --- Gestion Statut (Activer/Désactiver) ---
  updateUserStatus(userId: number, isActive: boolean): void {
    if (userId === this.loggedInUserId) {
        alert("Vous ne pouvez pas modifier votre propre statut.");
        return;
    }
    this.errorMessage = null; // Reset erreur globale
    this.actionSubscription?.unsubscribe(); // Annuler action précédente

    // Utiliser la méthode générique updateUser du service
    this.actionSubscription = this.authService.updateUser(userId, { isActive: isActive ? 1 : 0 }).subscribe({
       next: (updatedUser) => {
         console.log(`Statut utilisateur ID ${userId} mis à jour :`, updatedUser);
         this.updateUserInList(updatedUser); // Mettre à jour l'état local
         // TODO: Afficher un message de succès (toast/snackbar)
       },
       error: (error: HttpErrorResponse) => {
         this.errorMessage = this.formatError(error, 'Erreur lors de la mise à jour du statut.');
         console.error('Erreur mise à jour statut:', error);
       }
     });
  }

  // --- Gestion Rôle ---
  updateUserRole(userId: number, newRole: 'admin' | 'client'): void {
     if (userId === this.loggedInUserId) {
        alert("Vous ne pouvez pas modifier votre propre rôle.");
        return;
     }
    this.errorMessage = null;
    this.actionSubscription?.unsubscribe();

    // Si updateUser peut gérer le rôle, sinon utiliser updateRole s'il existe
    this.actionSubscription = this.authService.updateUser(userId, { role: newRole }).subscribe({
      next: (updatedUser) => {
        console.log('Rôle utilisateur mis à jour :', updatedUser);
        this.updateUserInList(updatedUser); // Mettre à jour l'état local
        // TODO: Afficher un message de succès (toast/snackbar)
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.formatError(error, 'Erreur lors de la mise à jour du rôle.');
        console.error('Erreur mise à jour rôle:', error);
      }
    });
  }

  // --- Gestion Modale Confirmation Suppression ---
  openConfirmDeleteModal(user: User): void {
    if (user.id === this.loggedInUserId) {
        alert("Vous ne pouvez pas supprimer votre propre compte.");
        return;
    }
    this.userToDelete = user;
    this.isDeletingUser = false;
    this.modalErrorMessage = null; // Reset erreur modale si utilisée
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.userToDelete = null;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete) return;

    this.isDeletingUser = true;
    const userId = this.userToDelete.id;
    this.errorMessage = null; // Reset erreur globale
    this.actionSubscription?.unsubscribe(); // Annuler action précédente

    // Assurez-vous que votre service a une méthode `deleteUser`
    this.actionSubscription = this.authService.deleteUser(userId).subscribe({
        next: () => { // L'API peut ne renvoyer que 200/204 sans body
          console.log(`Utilisateur ID ${userId} supprimé avec succès.`);
          this.closeConfirmModal();
          // Supprimer de la liste locale
          this.users = this.users?.filter(u => u.id !== userId) || null;
          this.isDeletingUser = false;
          // TODO: Afficher un message de succès (toast/snackbar)
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.formatError(error, 'Erreur lors de la suppression de l\'utilisateur.');
          this.isDeletingUser = false;
          // On ne ferme pas forcément la modale d'erreur, laisser l'utilisateur voir
          console.error('Erreur suppression utilisateur:', error);
          // Pourrait être mis dans modalErrorMessage si on veut l'erreur dans la modale
          // this.modalErrorMessage = this.formatError(error, 'Erreur lors de la suppression.');
        }
      });
  }

  // --- Déconnexion ---
  logout(): void {
    this.authService.logout(); // Le service gère la suppression du token et la redirection
    console.log("Déconnexion initiée");
  }

  // --- Utilitaires ---
  private updateUserInList(updatedUser: User): void {
    const index = this.users?.findIndex(u => u.id === updatedUser.id);
    if (this.users && index !== undefined && index > -1) {
      const newUsers = [...this.users]; // Nouvelle référence pour détection de changement
      newUsers[index] = updatedUser;
      this.users = newUsers;
    } else {
      // Cas improbable où l'utilisateur n'est pas trouvé, recharger
      console.warn(`Utilisateur ID ${updatedUser.id} non trouvé dans la liste locale après mise à jour. Rechargement.`);
      this.loadUsers();
    }
  }

  private formatError(error: HttpErrorResponse, defaultMessage: string): string {
    // Essaye d'extraire un message d'erreur métier de la réponse API
    if (error?.error?.message && typeof error.error.message === 'string') {
        return error.error.message;
    }
     // Essaye d'extraire un message d'erreur standard
    if (error?.message) {
      return error.message;
    }
    // Sinon, message par défaut
    return defaultMessage;
  }

}