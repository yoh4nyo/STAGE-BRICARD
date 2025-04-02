import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // Assurez-vous que le chemin est correct
import { adminGuard } from './guards/admin.guard'; // Assurez-vous que le chemin est correct

// Composant
import { LoginComponent } from './component/login/login.component';
import { DashboardClientComponent } from './component/dashboard-client/dashboard-client.component';
import { DashboardAdminComponent } from './component/dashboard-admin/dashboard-admin.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard-client', component: DashboardClientComponent, canActivate: [AuthGuard], data: { role: 'client' } },
  { path: 'dashboard-admin', component: DashboardAdminComponent, canActivate: [adminGuard], data: { role: 'admin' } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
