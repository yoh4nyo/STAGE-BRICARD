import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../service/auth.service';

@Component({
  selector: 'app-dashboard-client',
  imports: [CommonModule],
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.css'] 
})

export class DashboardClientComponent implements OnInit { // Implémente OnDestroy
  userInfo: User | null = null; // Utilise l'interface User
  private userSubscription: Subscription | null = null; // Pour gérer la désinscription

  constructor(private authService: AuthService) { } // Injecte ton AuthService

  ngOnInit(): void {
    // S'abonner aux changements de l'utilisateur pour mettre à jour l'UI
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
        this.userInfo = user;
        console.log('DashboardComponent: User info updated:', this.userInfo);
    });

  }

  // Méthode appelée par le bouton de déconnexion
  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
      // Se désinscrire de l'observable utilisateur lors de la destruction
      this.userSubscription?.unsubscribe();
  }
}