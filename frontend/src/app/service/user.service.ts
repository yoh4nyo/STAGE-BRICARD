// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user'; // Importez votre interface User

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3001/api'; // URL de votre API backend

  constructor(private http: HttpClient) { }

  // Récupérer tous les utilisateurs
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  // Créer un nouvel utilisateur
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  // Connexion utilisateur
  login(credentials: any): Observable<any> { // Adaptez le type si nécessaire
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }


  // ... autres méthodes pour interagir avec l'API (modifier, supprimer, etc.)
}