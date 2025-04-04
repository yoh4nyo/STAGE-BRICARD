import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService, User } from '../../service/auth.service'; 
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr'; 

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  users: User[] | null = null;
  isLoading: boolean = false;
  loggedInUserId: number | null = null;

  // --- États pour les modales ---
  isUserModalOpen: boolean = false;
  isConfirmModalOpen: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentUser: Partial<User> = {};
  userToDelete: User | null = null;
  isSavingUser: boolean = false;
  isDeletingUser: boolean = false;

  // --- Souscriptions ---
  private usersSubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService 
  ) { }

  ngOnInit(): void {
     try {
       const currentUserInfo = this.authService.getUserInfoFromToken();
       this.loggedInUserId = currentUserInfo ? currentUserInfo.id : null;
       if (!this.loggedInUserId) {
         console.warn("Impossible de récupérer l'ID de l'utilisateur connecté.");
         this.toastr.warning("Impossible d'identifier l'utilisateur connecté.", "Attention");
       }
     } catch (e) {
       console.error("Erreur lors de la récupération des informations utilisateur:", e);
       this.toastr.error("Erreur d'initialisation des informations utilisateur.", "Erreur Critique");
     }
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
    this.actionSubscription?.unsubscribe();
  }

  // --- Chargement des utilisateurs ---
  loadUsers(): void {
    this.isLoading = true;
    this.users = null;
    this.usersSubscription?.unsubscribe();

    this.usersSubscription = this.authService.getUsers().subscribe({
      next: (fetchedUsers: User[]) => {
        this.users = fetchedUsers;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.users = [];
        this.toastr.error(this.formatError(error, 'Erreur chargement des utilisateurs.'), 'Erreur Réseau');
        console.error('Erreur chargement utilisateurs:', error);
      }
    });
  }

  // --- Gestion Modale Ajout/Modification ---
  openUserModal(mode: 'add' | 'edit', user: User | null = null): void {
    this.modalMode = mode;
    this.isSavingUser = false;
    this.isUserModalOpen = true;
    if (mode === 'add') {
        this.currentUser = { role: 'client' };
      } else if (user) {
        this.currentUser = { ...user };
        delete this.currentUser.password;
      } else {
          console.error("Tentative d'ouverture de la modale d'édition sans utilisateur.");
          this.closeUserModal();
      }
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
    this.currentUser = {};
  }

  saveUser(form: NgForm): void {
    if (form.invalid) {
      // Afficher une erreur générique avec Toastr au lieu de modalErrorMessage
      this.toastr.warning("Veuillez remplir correctement tous les champs requis.", "Formulaire Invalide");
      Object.values(form.controls).forEach(control => { control.markAsTouched(); });
      return;
    }

    this.isSavingUser = true;
    const userData = { ...this.currentUser };
    this.actionSubscription?.unsubscribe();

    let request$;
    const actionText = this.modalMode === 'add' ? 'ajout' : 'modification';

    if (this.modalMode === 'add') {
      if (!userData.password || userData.password.length < 6) {
        this.toastr.error("Le mot de passe est requis (minimum 6 caractères).", "Validation échouée");
        this.isSavingUser = false;
        return;
      }
      request$ = this.authService.createUser(userData as User);

    } else { 
      const userId = userData.id;
      if (!userId) {
        this.toastr.error("Impossible de modifier : ID utilisateur manquant.", "Erreur Interne");
        this.isSavingUser = false;
        return;
      }
      const updateData: Partial<User> = { firstName: userData.firstName, lastName: userData.lastName, email: userData.email, role: userData.role };
      request$ = this.authService.updateUser(userId, updateData);
    }

    this.actionSubscription = request$.subscribe({
      next: (responseUser) => {
        const successMessage = `Utilisateur ${responseUser.firstName} ${responseUser.lastName} ${this.modalMode === 'add' ? 'ajouté' : 'modifié'} avec succès !`;
        this.toastr.success(successMessage, 'Succès'); 
        this.closeUserModal();
        this.loadUsers();
        this.isSavingUser = false;
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error(this.formatError(error, `Erreur lors de ${actionText}.`), 'Sauvegarde échouée');
        this.isSavingUser = false;
        console.error(`Erreur ${actionText} utilisateur:`, error);
      }
    });
  }

  // --- Gestion Statut ---
  updateUserStatus(userId: number, isActive: boolean): void {
    if (userId === this.loggedInUserId) {
        this.toastr.warning("Vous ne pouvez pas modifier votre propre statut.", "Action Interdite");
        return;
    }
    this.actionSubscription?.unsubscribe();

    const actionText = isActive ? 'activation' : 'désactivation';
    // Ajouter ici un état de chargement spécifique à la ligne si souhaité

    this.actionSubscription = this.authService.updateUser(userId, { isActive: isActive ? 1 : 0 }).subscribe({
       next: (updatedUser) => {
         this.toastr.success(`Utilisateur ${updatedUser.firstName} ${updatedUser.lastName} ${isActive ? 'réactivé' : 'désactivé'}.`, 'Statut mis à jour');
         this.updateUserInList(updatedUser);
       },
       error: (error: HttpErrorResponse) => {
         this.toastr.error(this.formatError(error, `Erreur lors de ${actionText}.`), 'Mise à jour échouée');
         console.error(`Erreur ${actionText}:`, error);
       }
     });
  }

  // --- Gestion Rôle ---
  updateUserRole(userId: number, newRole: 'admin' | 'client'): void {
     if (userId === this.loggedInUserId) {
        this.toastr.warning("Vous ne pouvez pas modifier votre propre rôle.", "Action interdite");
        return;
     }
    // this.errorMessage = null; // Plus nécessaire
    this.actionSubscription?.unsubscribe();

    this.actionSubscription = this.authService.updateUser(userId, { role: newRole }).subscribe({
      next: (updatedUser) => {
        this.toastr.success(`Rôle de ${updatedUser.firstName} ${updatedUser.lastName} mis à jour vers ${newRole}.`, 'Rôle modifié');
        this.updateUserInList(updatedUser);
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error(this.formatError(error, 'Erreur lors de la mise à jour du rôle.'), 'Mise à jour échouée');
        console.error('Erreur mise à jour rôle:', error);
      }
    });
  }

  // --- Gestion Modale Confirmation Suppression ---
  openConfirmDeleteModal(user: User): void {
    if (user.id === this.loggedInUserId) {
        this.toastr.warning("Vous ne pouvez pas supprimer votre propre compte.", "Action Interdite");
        return;
    }
    this.userToDelete = user;
    this.isDeletingUser = false;
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
    const userName = `${this.userToDelete.firstName} ${this.userToDelete.lastName}`; 
    this.actionSubscription?.unsubscribe();

    this.actionSubscription = this.authService.deleteUser(userId).subscribe({
        next: () => {
          this.toastr.success(`Utilisateur ${userName} supprimé avec succès.`, 'Suppression Réussie');
          this.closeConfirmModal();
          this.users = this.users?.filter(u => u.id !== userId) || null;
          this.isDeletingUser = false;
        },
        error: (error: HttpErrorResponse) => {
          // Afficher l'erreur dans un toast au lieu de fermer la modale ? Ou les deux ?
          this.toastr.error(this.formatError(error, 'Erreur lors de la suppression.'), 'Suppression échouée');
          this.isDeletingUser = false;
          console.error('Erreur suppression utilisateur:', error);
        }
      });
  }

  // --- Déconnexion ---
  logout(): void {
    this.authService.logout();
    this.toastr.info('Vous avez été déconnecté.', 'Session Terminée');
  }


  private updateUserInList(updatedUser: User): void {
    const index = this.users?.findIndex(u => u.id === updatedUser.id);
    if (this.users && index !== undefined && index > -1) {
      const newUsers = [...this.users];
      newUsers[index] = updatedUser;
      this.users = newUsers;
    } else {
      console.warn(`Utilisateur ID ${updatedUser.id} non trouvé localement après MAJ. Rechargement.`);
      this.loadUsers();
    }
  }

  private formatError(error: HttpErrorResponse, defaultMessage: string): string {
    if (error?.error?.message && typeof error.error.message === 'string') { return error.error.message; }
    if (error?.message) { return error.message; }
    return defaultMessage;
  }

}