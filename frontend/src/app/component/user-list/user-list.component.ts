// user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-list',
  template: `
    <ul>
      <li *ngFor="let user of users">
        {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
      </li>
    </ul>
  `,
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getUsers().subscribe(
      (users) => {
        this.users = users;
      },
      (error) => {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
        // Gérer l'erreur (afficher un message, etc.)
      }
    );
  }
}
