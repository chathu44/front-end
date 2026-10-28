import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StudentComponent } from './component/student/student.component';
import { CourseComponent } from './component/course/course.component';
import { TeacherComponent } from './component/teacher/teacher.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ClassComponent } from './component/class/class.component';
import { ForbiddenComponent } from './component/forbidden/forbidden.component';
import { AuthGuard } from './component/auth/auth.guard';
import { AuthInterceptor } from './component/auth/auth.interceptor';
import { InstituteLoginComponent } from './component/institute-login/institute-login.component';
import { RegisterComponent } from './component/register/register.component';
import { PrivilegeComponent } from './component/privilege/privilege.component';
import { QualificationComponent } from './component/qualification/qualification.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ChildComponent } from './component/child/child.component';
import { ParentComponent } from './component/parent/parent.component';
import { ClassroomComponent } from './component/classroom/classroom.component';
import { ProgramComponent } from './component/program/program.component';
import { EnrollmentComponent } from './component/enrollment/enrollment.component';
import { AttendanceComponent } from './component/attendance/attendance.component';
import { MealPlanComponent } from './component/meal-plan/meal-plan.component';
import { IncidentComponent } from './component/incident/incident.component';
import { FeePaymentComponent } from './component/fee-payment/fee-payment.component';

@NgModule({
  declarations: [
    AppComponent,
    StudentComponent,
    CourseComponent,
    TeacherComponent,
    DashboardComponent,
    ClassComponent,
    ForbiddenComponent,
    InstituteLoginComponent,
    RegisterComponent,
    PrivilegeComponent,
    QualificationComponent,
    ChildComponent,
    ParentComponent,
    ClassroomComponent,
    ProgramComponent,
    EnrollmentComponent,
    AttendanceComponent,
    MealPlanComponent,
    IncidentComponent,
    FeePaymentComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    NgSelectModule,
  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
