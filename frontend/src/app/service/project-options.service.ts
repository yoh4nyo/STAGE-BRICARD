import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour les niveaux de sécurité
export interface SecurityLevel {
  code: string; // La valeur interne (ex: 'Dual XP S2')
  label: string; // Le texte affiché (ex: 'Niveau 4: Dual XP S2')
}

// Ajoutons aussi l'interface pour les types d'organigramme
export interface OrganigrammeType {
    code: string; // ex: 'passe_generale'
    label: string; // ex: 'PG (Passe Général)'
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
}