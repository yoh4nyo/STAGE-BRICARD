import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour les niveaux de sécurité
export interface SecurityLevel {
  code: string; 
  label: string; 
}

// interface pour les types d'organigramme
export interface OrganigrammeType {
    code: string; 
    label: string;
}

export interface ProjectCreatePayload {
  name: string;
  type: string;
  creationDate: string;
  securityLevel: string;
  userId: number;
}

export interface ProjectCreationResponse {
  message: string;
  projectId: number;
}

// ---> AJOUT: Interface pour les détails de l'étape 2 <---
//    Les propriétés sont optionnelles car toutes ne s'appliquent pas à chaque type
export interface ProjectDetailsPayload {
  logementDoors?: number | null;
  hasPrivateCellars?: boolean | null; // Garde boolean ici, conversion en backend
  commonDoors?: number | null;
  extraCommonKeys?: boolean | null; // Garde boolean ici
  pgKeys?: number | null;
  totalDoorsPG?: number | null;
}


@Injectable({
  providedIn: 'root' 
})

export class ProjectOptionsService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  // Méthode pour récupérer les niveaux de sécurité
  getSecurityLevels(): Observable<SecurityLevel[]> {
    return this.http.get<SecurityLevel[]>(`${this.apiUrl}/security-levels`);
  }

  // Méthode pour récupérer les types d'organigrammes
  getOrganigrammeTypes(): Observable<OrganigrammeType[]> {
    return this.http.get<OrganigrammeType[]>(`${this.apiUrl}/organigramme-types`);
  }

  createProject(projectData: ProjectCreatePayload): Observable<ProjectCreationResponse> {
    console.log('Creating project with data:', projectData); // Log the project data
    return this.http.post<ProjectCreationResponse>(`${this.apiUrl}/projects`, projectData);
  }

  updateProjectDetails(projectId: number, details: ProjectDetailsPayload): Observable<any> {
    console.log(`Service: Calling PATCH /api/projects/${projectId}/details with data:`, details);
    return this.http.patch<any>(`${this.apiUrl}/projects/${projectId}/details`, details);
  }
}