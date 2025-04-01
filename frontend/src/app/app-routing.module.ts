import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component'; // Importation du composant de connexion
import { authGuard } from '../guards/auth.guard'; // Importation du guard d'authentification
import { adminGuard } from '../guards/admin.guard'; // Importation du guard d'administration

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige vers la page de connexion par défaut
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
