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
import { ChildComponent } from './component/child/child.component';
import { ParentComponent } from './component/parent/parent.component';
import { ClassroomComponent } from './component/classroom/classroom.component';
import { ProgramComponent } from './component/program/program.component';
import { EnrollmentComponent } from './component/enrollment/enrollment.component';
import { AttendanceComponent } from './component/attendance/attendance.component';
import { MealPlanComponent } from './component/meal-plan/meal-plan.component';
import { IncidentComponent } from './component/incident/incident.component';
import { FeePaymentComponent } from './component/fee-payment/fee-payment.component';

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
  { path: 'privilege', component: PrivilegeComponent, canActivate: [AuthGuard], data: { requiredAuthIds: [6] } },

  { path: 'child', component: ChildComponent, canActivate: [AuthGuard] },
  { path: 'parent', component: ParentComponent, canActivate: [AuthGuard] },
  { path: 'classroom', component: ClassroomComponent, canActivate: [AuthGuard] },
  { path: 'program', component: ProgramComponent, canActivate: [AuthGuard] },
  { path: 'enrollment', component: EnrollmentComponent, canActivate: [AuthGuard] },
  { path: 'attendance', component: AttendanceComponent, canActivate: [AuthGuard] },
  { path: 'meal-plan', component: MealPlanComponent, canActivate: [AuthGuard] },
  { path: 'meal-record', redirectTo: 'meal-plan', pathMatch: 'full' },
  { path: 'incident', component: IncidentComponent, canActivate: [AuthGuard] },
  { path: 'fee-payment', component: FeePaymentComponent, canActivate: [AuthGuard] },
  
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
