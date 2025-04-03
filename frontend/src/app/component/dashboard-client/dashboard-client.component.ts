import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectOptionsService, SecurityLevel } from '../../service/project-options.service'; // Adapte le chemin si besoin

interface NewProjectData {
name: string;
type: string;
creationDate: string;
securityLevel: string;
}

@Component({
selector: 'dashboard-client',
imports: [CommonModule, FormsModule],
templateUrl: './dashboard-client.component.html',
styleUrls: ['./dashboard-client.component.css']
})

export class DashboardClientComponent implements OnInit, OnDestroy {
userInfo: User | null = null;
private userSubscription: Subscription | null = null;

isModalOpen: boolean = false;
isSubmitting: boolean = false;
showDatePicker: boolean = false; 

newProject: NewProjectData = {
  name: '',
  type: '',
  creationDate: new Date().toISOString().split('T')[0], 
  securityLevel: ''
};

securityLevels: SecurityLevel[] = [];

constructor(
  private authService: AuthService,
  private router: Router,
  private projectOptionsService: ProjectOptionsService
) { }

ngOnInit(): void {
  this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.userInfo = user;
      console.log('DashboardClient: User info updated:', this.userInfo);
  });

  this.loadDropdownOptions();
}

ngOnDestroy(): void {
  // Se désinscrire pour éviter les fuites mémoire (inchangé)
  this.userSubscription?.unsubscribe();
  if (this.isModalOpen) {
      document.body.style.overflow = 'auto';
  }
}

loadDropdownOptions(): void {
  this.projectOptionsService.getSecurityLevels().subscribe({
      next: (data) => {
          this.securityLevels = data;
          console.log('Niveaux de sécurité chargés:', this.securityLevels);
      },
      error: (error) => {
          console.error('Erreur lors du chargement des niveaux de sécurité:', error);
      }
  });
}


logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']);
}

openModal(): void {
  this.newProject = {
      name: '',
      type: '', 
      creationDate: new Date().toISOString().split('T')[0], 
      securityLevel: '' 
  };
  this.isSubmitting = false;
  this.isModalOpen = true;
  document.body.style.overflow = 'hidden';
}

closeModal(): void {
  this.isModalOpen = false;
  document.body.style.overflow = 'auto';
}

// Méthode de soumission (inchangée pour l'instant, utilise toujours la simulation)
submitProject(): void {
  console.log('Tentative de soumission du projet :', this.newProject);

  if (!this.newProject.name || !this.newProject.type || !this.newProject.securityLevel || !this.newProject.creationDate) {
      alert('Veuillez remplir tous les champs.');
      return; 
  }

  this.isSubmitting = true;

  // ---- SIMULATION D'APPEL API (inchangée) ----
  // C'est ici que tu remplacerais par l'appel réel pour CRÉER le projet
  // en envoyant this.newProject au backend
  console.log('Envoi des données au backend (simulation)...', this.newProject);
  setTimeout(() => {
    try {
      const newProjectId = Math.floor(Math.random() * 1000);
      console.log(`Projet créé avec succès (simulation), ID: ${newProjectId}`);
      alert('Projet démarré avec succès !');
      this.isSubmitting = false;
      this.closeModal();
      // this.router.navigate(['/project', newProjectId]); // Ajuster la route
    } catch (error) {
      console.error("Erreur lors de la création du projet (simulation):", error);
      alert("Une erreur est survenue lors de la création du projet.");
      this.isSubmitting = false;
    }
  }, 2000);
}

hideDatePicker(): void {
  setTimeout(() => {
      this.showDatePicker = false;
      console.log('hideDatePicker called');
  }, 200);
}
}