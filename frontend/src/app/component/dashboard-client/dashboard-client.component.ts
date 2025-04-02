import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../service/auth.service';
import { FormsModule } from '@angular/forms'; // FormsModule est déjà importé, c'est bien
import { Router } from '@angular/router'; // Import Router si tu en as besoin après la création

// Interface pour les données du nouveau projet (corrigé la typo secirityLevel)
interface NewProjectData {
  name: string;
  type: string;
  creationDate: string; // Gardé en string pour correspondre à l'input text JJ/MM/AAAA pour l'instant
  // Ou utilise 'creationDate: Date | null = null;' si tu utilises un input type="date"
  securityLevel: string; // Correction de la typo
}

@Component({
  selector: 'app-dashboard-client',
  imports: [CommonModule, FormsModule], // Garde ces imports pour standalone
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.css']
})
export class DashboardClientComponent implements OnInit, OnDestroy { // Implémente OnDestroy
  userInfo: User | null = null;
  private userSubscription: Subscription | null = null;

  // --- États pour la Modale (AJOUTÉS) ---
  isModalOpen: boolean = false;
  isSubmitting: boolean = false; // Pour désactiver le bouton pendant la création
  showDatePicker: boolean = false; // Pour afficher/masquer le date picker

  // --- Données du formulaire (AJOUTÉES) ---
  newProject: NewProjectData = {
    name: '',
    type: '', // Valeur initiale pour select
    creationDate: '', // Valeur initiale pour input text
    securityLevel: '' // Valeur initiale pour select
  };

  // Injecter Router si nécessaire pour la navigation après création
  constructor(
      private authService: AuthService,
      private router: Router
      // Injecter un ProjectService si besoin
      // private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    // S'abonner aux changements de l'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
        this.userInfo = user;
        console.log('DashboardClient: User info updated:', this.userInfo);
    });
  }

  ngOnDestroy(): void {
    // Se désinscrire pour éviter les fuites mémoire
    this.userSubscription?.unsubscribe();
    // Assurer la réactivation du scroll si le composant est détruit pendant que la modale est ouverte
    if (this.isModalOpen) {
        document.body.style.overflow = 'auto';
    }
  }

  // Méthode appelée par le bouton de déconnexion (EXISTANTE)
  logout(): void {
    this.authService.logout();
  }

  // --- Méthodes pour la Modale (AJOUTÉES) ---

  openModal(): void {
    // Réinitialiser le formulaire avant d'ouvrir
    this.newProject = { name: '', type: '', creationDate: '', securityLevel: '' };
    this.isSubmitting = false;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden'; // Empêche le scroll derrière
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto'; // Réactive le scroll
  }

  // Méthode appelée lors de la soumission du formulaire (AJOUTÉE)
  submitProject(): void {
    console.log('Tentative de soumission du projet :', this.newProject);
    this.isSubmitting = true;

    // ---- SIMULATION D'APPEL API ----
    // Remplacer ceci par un appel à votre service (ex: this.projectService.create(...))
    console.log('Envoi des données au backend (simulation)...');
    setTimeout(() => {
      try {
        // Simuler une réponse (peut-être avec l'ID du nouveau projet)
        const newProjectId = Math.floor(Math.random() * 1000);
        console.log(`Projet créé avec succès (simulation), ID: ${newProjectId}`);

        // Actions après succès
        alert('Projet démarré avec succès !'); // Message simple
        this.isSubmitting = false;
        this.closeModal();

        // Optionnel: Naviguer vers la page du projet créé
        // this.router.navigate(['/project', newProjectId]); // Ajuster la route

      } catch (error) {
        console.error("Erreur lors de la création du projet (simulation):", error);
        alert("Une erreur est survenue lors de la création du projet."); // Message d'erreur simple
        this.isSubmitting = false; // Important de réactiver le bouton même en cas d'erreur
      }
    }, 2000); // Simule 2 secondes d'attente
    // ---- FIN SIMULATION ----
  }

  // --- Méthodes pour gérer le focus/blur du champ date (simpliste) ---
  // <<<--- AJOUTÉ: Méthode manquante ---
  hideDatePicker(): void {
    // Timeout pour permettre le clic sur un date picker avant que le blur ne cache tout
    // Si tu n'as pas de date picker, tu peux simplifier ou supprimer cette logique complexe
    setTimeout(() => {
        // Vérifier si un élément lié au date picker (s'il existe) n'a pas le focus
        // Pour l'instant, on le cache juste après un délai
        this.showDatePicker = false;
        console.log('hideDatePicker called'); // Pour déboguer
    }, 200); // Délai court
  }
}