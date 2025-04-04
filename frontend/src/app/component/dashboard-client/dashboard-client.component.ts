import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../service/auth.service';
import { FormsModule, NgForm } from '@angular/forms'; // Import NgForm
import { Router } from '@angular/router';

// Assure-toi que toutes les interfaces nécessaires sont importées et CORRECTEMENT DEFINIES dans le service
import {
  ProjectOptionsService,
  SecurityLevel,
  OrganigrammeType,
  ProjectCreatePayload,   // Interface pour l'API POST finale (inclut TOUT)
  ProjectCreationResponse,
  ProjectDetailsPayload   // Interface pour les champs du formulaire Étape 2
} from '../../service/project-options.service';

// Interface pour les données du formulaire Étape 1 (inchangée)
interface NewProjectData {
  name: string;
  type: string;
  creationDate: string;
  securityLevel: string;
}

@Component({
  selector: 'app-dashboard-client',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.css']
})
export class DashboardClientComponent implements OnInit, OnDestroy {
  userInfo: User | null = null;
  private userSubscription: Subscription | null = null;

  // --- États ---
  isModalOpen: boolean = false;
  isSubmitting: boolean = false; // Unique flag pour les deux étapes
  currentStep: number = 1;      // Étape actuelle (1 ou 2)
  // createdProjectId: number | null = null; // N'est plus nécessaire ici

  // --- Données Formulaires ---
  // Étape 1: lié au formulaire initial
  newProject: NewProjectData = this.resetStep1Form();

  // Étape 2: lié au formulaire des questions spécifiques
  // Utilise l'interface ProjectDetailsPayload pour typer le formulaire Étape 2
  projectDetails: ProjectDetailsPayload = this.resetStep2Form();

  // Pour les dropdowns Étape 1
  securityLevels: SecurityLevel[] = [];
  organigrammeTypes: OrganigrammeType[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectOptionsService: ProjectOptionsService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
        this.userInfo = user;
        console.log('DashboardClient: User info available:', this.userInfo);
    });
    this.loadDropdownOptions();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    if (this.isModalOpen) {
        document.body.style.overflow = 'auto';
    }
  }

  // --- Fonctions de Réinitialisation ---
  resetStep1Form(): NewProjectData {
    return {
        name: '',
        type: '',
        creationDate: new Date().toISOString().split('T')[0],
        securityLevel: ''
    };
  }

  resetStep2Form(): ProjectDetailsPayload {
    // Initialise les champs attendus par ProjectDetailsPayload
    // Assure-toi que cette interface est bien définie dans ton service
    return {
      logementDoors: null,
      hasPrivateCellars: false, // Valeur par défaut explicite
      commonDoors: null,
      extraCommonKeys: false, // Valeur par défaut explicite
      pgKeys: null,
      totalDoorsPG: null
    };
  }

  // --- Chargement Options Dropdown (Inchangé) ---
  loadDropdownOptions(): void {
    console.log("loadDropdownOptions: Début du chargement des options.");
    this.projectOptionsService.getSecurityLevels().subscribe({
        next: (data) => { this.securityLevels = data; /* console.log('Niveaux chargés:', this.securityLevels); */ },
        error: (error) => { console.error('Erreur chargement niveaux:', error); }
    });
    this.projectOptionsService.getOrganigrammeTypes().subscribe({
        next: (data) => { this.organigrammeTypes = data; /* console.log('Types chargés:', this.organigrammeTypes); */ },
        error: (error) => { console.error('Erreur chargement types:', error); }
    });
  }

  // --- Actions Modale ---
  openModal(): void {
    this.newProject = this.resetStep1Form();
    this.projectDetails = this.resetStep2Form(); // Réinitialise aussi l'étape 2
    this.currentStep = 1;                   // Commence toujours à l'étape 1
    // this.createdProjectId = null; // Plus besoin
    this.isModalOpen = true;
    this.isSubmitting = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
    this.currentStep = 1; // Réinitialiser l'étape en fermant
    // this.createdProjectId = null; // Plus besoin
  }

  // --- Soumissions Étapes ---

  // Étape 1 : Valider et passer à l'étape 2 (SANS appel API)
  submitStep1(form: NgForm): void {
    console.log('Validation Étape 1:', this.newProject);
    if (form.invalid) {
        alert('Veuillez remplir tous les champs de l\'étape 1.');
        // Marquer les champs comme touchés pour afficher les erreurs visuellement
        Object.keys(form.controls).forEach(key => { form.controls[key].markAsTouched(); });
        return;
    }
    // Simplement passer à l'étape suivante
    this.currentStep = 2;
    console.log('Passage à l\'étape 2. Données étape 1:', this.newProject);
  }

  // Étape 2 : Combiner, Valider et Créer le projet complet (AVEC appel API)
  submitStep2(form: NgForm): void {
    console.log('Tentative de soumission Étape 2 (finale):', this.projectDetails);

    // Validation du formulaire de l'étape 2
    if (form.invalid) {
        alert('Veuillez remplir tous les champs requis pour cette étape.');
        Object.keys(form.controls).forEach(key => {
            if (form.controls[key]) { form.controls[key].markAsTouched(); }
        });
        return;
    }
    // Vérification cruciale de l'ID utilisateur
    if (!this.userInfo?.id) {
       alert("Erreur : ID utilisateur manquant. Impossible de créer le projet.");
       return;
    }

    this.isSubmitting = true; // Début de la soumission finale

    // --- Combinaison des données des deux étapes ---
    const finalPayload: ProjectCreatePayload = {
        // Données Étape 1 (stockées dans this.newProject)
        name: this.newProject.name,
        type: this.newProject.type,
        creationDate: this.newProject.creationDate,
        securityLevel: this.newProject.securityLevel,
        userId: this.userInfo.id,
        // Données Étape 2 (stockées dans this.projectDetails)
        ...this.projectDetails // Utilise l'opérateur spread pour copier les propriétés
    };

    console.log("Frontend: Sending combined payload to backend (POST /projects):", finalPayload);

    // --- Appel UNIQUE à l'API pour créer le projet complet ---
    this.projectOptionsService.createProject(finalPayload).subscribe({
        next: (response: ProjectCreationResponse) => {
            console.log('Projet complet créé avec succès! Response:', response);
            this.isSubmitting = false;
            this.closeModal(); // Ferme la modale après succès
            alert(`Projet "${finalPayload.name}" créé avec succès !`);

            // Navigue vers l'éditeur de matrice, en utilisant l'ID retourné par le backend
            this.router.navigate(['/creation-organigramme', response.projectId]); // Adapte la route si nécessaire
        },
        error: (error) => {
            console.error('Erreur lors de la création complète du projet:', error);
            alert(`Erreur lors de la création du projet: ${error.error?.message || error.message}`);
            this.isSubmitting = false; // Réactive le bouton même en cas d'erreur
        }
    });
  } // Fin submitStep2

  // --- Navigation Interne ---
  // Permet de revenir à l'étape 1 depuis l'étape 2
  goToStep1(): void {
    if (!this.isSubmitting) { // Empêche de revenir pendant une soumission
        this.currentStep = 1;
        console.log("Retour à l'étape 1");
    }
  }

  // --- Déconnexion & Autres ---
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Méthode pour date picker (inchangée)
  hideDatePicker(): void { /* ... */ }

} // Fin de la classe DashboardClientComponent