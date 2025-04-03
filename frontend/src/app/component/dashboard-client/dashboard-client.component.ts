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
  ProjectCreatePayload, // Pour l'étape 1 API call
  ProjectCreationResponse,
  ProjectDetailsPayload  // Pour l'étape 2 API call et le formulaire étape 2
} from '../../service/project-options.service';

// Interface pour les données du formulaire Étape 1
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
  isSubmitting: boolean = false;
  currentStep: number = 1;
  createdProjectId: number | null = null;

  // --- Données Formulaires ---
  // Étape 1: lié au formulaire initial
  newProject: NewProjectData = this.resetStep1Form();

  // Étape 2: lié au formulaire des questions spécifiques
  // ---> CORRECTION TYPE ICI <---
  projectDetails: ProjectDetailsPayload = this.resetStep2Form(); // Doit correspondre à l'interface des détails

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

  // ---> CORRECTION TYPE RETOUR ICI <---
  resetStep2Form(): ProjectDetailsPayload {
    // Initialise les champs attendus par ProjectDetailsPayload
    return {
      logementDoors: null,
      hasPrivateCellars: false, // Mettre une valeur par défaut explicite (boolean non nullable)
      commonDoors: null,
      extraCommonKeys: false, // Mettre une valeur par défaut explicite
      pgKeys: null,
      totalDoorsPG: null
      // Assure-toi que ces clés correspondent à l'interface ProjectDetailsPayload
    };
  }

  // --- Chargement Options Dropdown ---
  loadDropdownOptions(): void {
    console.log("loadDropdownOptions: Début du chargement des options."); // Log de début

    // Appel pour les niveaux de sécurité
    this.projectOptionsService.getSecurityLevels().subscribe({
        next: (data) => {
            this.securityLevels = data;
            console.log('Niveaux de sécurité chargés:', this.securityLevels); // Log les données reçues
        },
        error: (error) => {
            console.error('Erreur lors du chargement des niveaux de sécurité:', error);
            // TODO: Afficher un message d'erreur à l'utilisateur si le chargement échoue
            // alert('Impossible de charger les niveaux de sécurité.');
        }
    });

    // Appel pour les types d'organigramme
    this.projectOptionsService.getOrganigrammeTypes().subscribe({
        next: (data) => {
            this.organigrammeTypes = data;
            console.log('Types d\'organigramme chargés:', this.organigrammeTypes); // Log les données reçues
        },
        error: (error) => {
            console.error('Erreur lors du chargement des types d\'organigramme:', error);
             // TODO: Afficher un message d'erreur à l'utilisateur si le chargement échoue
            // alert('Impossible de charger les types d\'organigramme.');
        }
    });
  }

  // --- Actions Modale ---
  openModal(): void {
    this.newProject = this.resetStep1Form();
    this.projectDetails = this.resetStep2Form(); // Appelle la fonction corrigée
    this.currentStep = 1;
    this.createdProjectId = null;
    this.isModalOpen = true;
    this.isSubmitting = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
    this.currentStep = 1;
    this.createdProjectId = null;
  }

  // --- Soumissions Étapes ---

  // Étape 1: Création initiale
  submitStep1(form: NgForm): void {
    console.log('Tentative de soumission Étape 1:', this.newProject);
    if (form.invalid) {
        alert('Veuillez remplir tous les champs de l\'étape 1.');
        Object.keys(form.controls).forEach(key => { form.controls[key].markAsTouched(); });
        return;
    }
    if (!this.userInfo?.id) {
        alert("Erreur : Impossible de récupérer l'ID utilisateur.");
        return;
    }

    this.isSubmitting = true;
    // Utilise l'interface ProjectCreatePayload pour l'API call de création
    const payload: ProjectCreatePayload = {
        name: this.newProject.name,
        type: this.newProject.type,
        creationDate: this.newProject.creationDate,
        securityLevel: this.newProject.securityLevel,
        userId: this.userInfo.id
    }; // Cet objet est correct et ne contient PAS logementDoors etc.

    console.log("Frontend: Sending STEP 1 payload to backend:", payload);

    this.projectOptionsService.createProject(payload).subscribe({
        next: (response) => {
            console.log('Étape 1 réussie ! Projet créé ID:', response.projectId);
            this.createdProjectId = response.projectId;
            this.currentStep = 2;
            this.isSubmitting = false;
        },
        error: (error) => {
            console.error('Erreur Étape 1:', error);
            alert(`Erreur lors de la création du projet: ${error.error?.message || error.message}`);
            this.isSubmitting = false;
        }
    });
  }

  // Étape 2: Mise à jour des détails
  submitStep2(form: NgForm): void {
    console.log('Tentative de soumission Étape 2:', this.projectDetails);

    if (form.invalid) { // Améliorer cette validation si besoin
        alert('Veuillez remplir tous les champs requis pour cette étape.');
        Object.keys(form.controls).forEach(key => {
            if (form.controls[key]) { form.controls[key].markAsTouched(); }
        });
        return;
    }
    if (!this.createdProjectId) {
       alert("Erreur : ID du projet manquant.");
       return;
    }

    this.isSubmitting = true;

    // Utilise l'interface ProjectDetailsPayload pour l'API call de mise à jour
    // L'objet this.projectDetails est maintenant correctement typé
    const detailsPayload: ProjectDetailsPayload = { ...this.projectDetails };

    console.log("Frontend: Sending STEP 2 payload to backend:", detailsPayload);

    // Appelle le service avec l'objet correctement typé
    this.projectOptionsService.updateProjectDetails(this.createdProjectId, detailsPayload).subscribe({
        next: (response) => {
            console.log('Étape 2 réussie ! Détails mis à jour.');
            this.isSubmitting = false;
            this.closeModal();
            alert('Configuration du projet terminée ! Vous allez être redirigé.');
            this.router.navigate(['/creation-organigramme', this.createdProjectId]); // Adapte la route
        },
        error: (error) => {
            console.error('Erreur Étape 2:', error);
            alert(`Erreur lors de la sauvegarde des détails: ${error.error?.message || error.message}`);
            this.isSubmitting = false;
        }
    });
  }

  // --- Navigation Interne ---
  goToStep1(): void {
    if (!this.isSubmitting) {
        this.currentStep = 1;
    }
  }

  // --- Déconnexion & Autres ---
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Méthode pour date picker (pas nécessaire pour ce problème, inchangée)
  hideDatePicker(): void { /* ... */ }

} // Fin de la classe