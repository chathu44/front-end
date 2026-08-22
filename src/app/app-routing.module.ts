import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentComponent } from './component/student/student.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { CourseComponent } from './component/course/course.component';
import { TeacherComponent } from './component/teacher/teacher.component';
import { ClassComponent } from './component/class/class.component';
import { InstituteLoginComponent } from './component/institute-login/institute-login.component';
import { RegisterComponent } from './component/register/register.component';
import { ForbiddenComponent } from './component/forbidden/forbidden.component';
import { AuthGuard } from './component/auth/auth.guard';
import { PrivilegeComponent } from './component/privilege/privilege.component';
import { QualificationComponent } from './component/qualification/qualification.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: InstituteLoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forbidden', component: ForbiddenComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'student', component: StudentComponent, canActivate: [AuthGuard] },
  { path: 'course', component: CourseComponent, canActivate: [AuthGuard] },
  { path: 'teacher', component: TeacherComponent, canActivate: [AuthGuard] },
  { path: 'qualification', component: QualificationComponent, canActivate: [AuthGuard] },
  { path: 'class', component: ClassComponent, canActivate: [AuthGuard] },
  { path: 'privilege', component: PrivilegeComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
