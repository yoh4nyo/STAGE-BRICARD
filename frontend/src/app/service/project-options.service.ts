import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour les niveaux de sécurité (utilisée pour la dropdown Étape 1)
export interface SecurityLevel {
  code: string;
  label: string;
}

// Interface pour les types d'organigramme (utilisée pour la dropdown Étape 1)
export interface OrganigrammeType {
    code: string;
    label: string;
}

// --- Interface pour les données envoyées lors de la CRÉATION COMPLÈTE ---
//    Contient les infos de base ET les détails optionnels de l'étape 2
export interface ProjectCreatePayload {
  // Étape 1 (requis)
  name: string;
  type: string;
  creationDate: string; // Format YYYY-MM-DD attendu par <input type="date">
  securityLevel: string;
  userId: number;
  // Étape 2 (optionnels - le backend les mettra à NULL s'ils ne sont pas fournis)
  logementDoors?: number | null;
  hasPrivateCellars?: boolean | null;
  commonDoors?: number | null;
  extraCommonKeys?: boolean | null;
  pgKeys?: number | null;
  totalDoorsPG?: number | null;
}

// Interface pour la réponse de l'API de création
export interface ProjectCreationResponse {
  message: string;
  projectId: number;
}

// --- Interface pour la MISE À JOUR des détails (conservée pour usage futur) ---
//    Ne contient QUE les champs modifiables via la route PATCH /details
//    (Tu peux la déplacer dans un autre service 'ProjectService' plus tard si tu préfères)
// Décommenter quand nécessaire pour la modification
export interface ProjectDetailsPayload {
    logementDoors?: number | null;
    hasPrivateCellars?: boolean | null;
    commonDoors?: number | null;
    extraCommonKeys?: boolean | null;
    pgKeys?: number | null;
    totalDoorsPG?: number | null;
    // Ajouter d'autres champs modifiables ici si besoin (ex: name, securityLevel?)
}


@Injectable({
  providedIn: 'root'
})
export class ProjectOptionsService {
  // Adapte l'URL si ton backend tourne sur un port ou domaine différent
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  // --- Méthodes pour charger les options des dropdowns (Étape 1) ---

  getSecurityLevels(): Observable<SecurityLevel[]> {
    console.log("Service: Fetching security levels...");
    return this.http.get<SecurityLevel[]>(`${this.apiUrl}/security-levels`);
  }

  getOrganigrammeTypes(): Observable<OrganigrammeType[]> {
    console.log("Service: Fetching organigramme types...");
    return this.http.get<OrganigrammeType[]>(`${this.apiUrl}/organigramme-types`);
  }

  // --- Méthode pour CRÉER le projet complet (appelée à la fin de l'étape 2) ---
  //    Elle envoie TOUTES les données (base + détails) en une seule fois
  createProject(projectData: ProjectCreatePayload): Observable<ProjectCreationResponse> {
    console.log("Service: Calling POST /api/projects (combined) with data:", projectData);
    // L'intercepteur ajoutera le token si nécessaire
    return this.http.post<ProjectCreationResponse>(`${this.apiUrl}/projects`, projectData);
  }

  // --- Méthode pour METTRE À JOUR les détails d'un projet existant ---
  //    (Non utilisée pour la création initiale, conservée pour modification future)
  /* // Décommenter et utiliser quand tu implémentes la modification de projet "brouillon"
  updateProjectDetails(projectId: number, details: ProjectDetailsPayload): Observable<any> {
    console.log(`Service: Calling PATCH /api/projects/${projectId}/details with data:`, details);
    // L'intercepteur ajoutera le token
    return this.http.patch<any>(`${this.apiUrl}/projects/${projectId}/details`, details);
  }
  */

  // --- Méthode pour récupérer les projets de l'utilisateur ---
  //    (Utile pour afficher la liste des projets sur le dashboard)
  getMyProjects(): Observable<any[]> { // Remplace any[] par une interface Project si tu en crées une
    console.log("Service: Calling GET /api/projects (for current user)");
    // L'intercepteur ajoutera le token
    return this.http.get<any[]>(`${this.apiUrl}/projects`);
  }

}