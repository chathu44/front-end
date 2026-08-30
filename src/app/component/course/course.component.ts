import { Component, OnInit } from '@angular/core';
import { CourseService } from '../services/api/course/course.service';
import { FormBuilder } from '@angular/forms';
import { CourseRepresentation } from '../services/api/module/course-representation';
import swal from 'sweetalert';
import { AuthIds, PermissionHelperService } from '../services/permission-helper.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {

  courses: Array<any> = [];
  isEditCourse = false;
  courseObj: CourseRepresentation = {};

  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private courseService: CourseService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.isEditCourse = false;
    this.canCreate = this.permissionHelper.has(AuthIds.COURSE_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.COURSE_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.COURSE_DELETE);
    this.GetAllCourses();
  }

  SaveCourse(): void {
    const type = this.isEditCourse ? 'Update' : 'Add';
    if (type === 'Add' && !this.canCreate) {
      return;
    }
    if (type === 'Update' && !this.canUpdate) {
      return;
    }

    if (type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'That you want to Add this details?',
        icon: 'warning',
        dangerMode: true,
      })
        .then(willDelete => {
          if (willDelete) {
            this.courseService.createCourse(this.courseObj, type)
              .subscribe({
                next: (): void => {
                  this.GetAllCourses();
                }
              });
            swal('Sucessfull!', 'Course has been Adedd!', 'success');
          }
        });
    } else {
      this.courseService.createCourse(this.courseObj, type)
        .subscribe({
          next: (): void => {
            this.GetAllCourses();
          }
        });
      swal('Sucessfull!', 'Course has been updated!', 'success');
    }
  }

  GetCourseById(ID: any): void {
    this.courseService.GetCourseById(ID).subscribe(allData => {
      this.courseObj = allData.data.dataList[0];
      this.isEditCourse = true;
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      return;
    }
    swal({
      title: 'Are you sure',
      text: 'That you want to Delete this Course?',
      icon: 'warning',
      dangerMode: true,
    })
      .then(willDelete => {
        if (willDelete) {
          swal('Deleted!', 'Course has been deleted!', 'success');
          this.courseService.DeleteCourseById(ID).subscribe(() => {
            this.GetAllCourses();
          });
        }
      });
  }

  GetAllCourses(): void {
    this.courseService.GetAllCourses().subscribe(allData => {
      this.courses = allData.data.dataList;
    });
  }
}
