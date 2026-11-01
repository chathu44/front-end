import { Component } from '@angular/core';
import { StudentRepresentation } from '../services/api/module/student-representation';
import { StudentService } from '../services/api/student/student.service';
import { StatusService } from '../services/api/status/status.service';
import { FormBuilder } from '@angular/forms';
import swal from 'sweetalert';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss'],
})
export class StudentComponent {
  studentObj: StudentRepresentation = {};
  students: Array<any> = [];
  allStatus: any;

  type: string;
  statusValue: any;
  isEditStudent: boolean = false;
  dtDynamicVerticalScrollExample: any;

  canCreate = false;
  canUpdate = false;
  canDelete = false;

  page = 0;
  pageSize = 5;
  totalPages = 0;
  totalElements = 0;
  pageSizeOptions = [5, 10, 20];

  constructor(
    private studentService: StudentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isEditStudent = false;
    this.canCreate = this.permissionHelper.has(AuthIds.STUDENT_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.STUDENT_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.STUDENT_DELETE);
    this.GetAllStatus();
    this.GetAllStudents();
  }

  SaveStudent(): void {
    this.type = this.isEditStudent == false ? 'Add' : 'Update';
    if (this.type == 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'That you want to Add this details?',
        icon: 'warning',
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          this.studentService
            .createStudent(this.studentObj, this.type)
            .subscribe({
              next: (result): void => {
                this.page = 0;
                this.GetAllStudents();
              },
            });
          swal('Sucessfull!', 'Student has been Adedd!', 'success');
        }
      });
    } else {
      console.log(this.studentObj);

      this.studentService.createStudent(this.studentObj, this.type).subscribe({
        next: (result): void => {
          this.GetAllStudents();
        },
      });
      swal('Sucessfull!', 'Student has been updated!', 'success');
    }
  }

  GetStudentById(ID: any) {
    this.studentService.GetStudentsById(ID).subscribe((allData) => {
      this.studentObj = allData.data.dataList[0];

      this.isEditStudent = true;
      this.statusValue = allData.data.dataList[0].status.name;
      this.studentObj.status = allData.data.dataList[0].status.id;
    });
  }

  GetAllStudents() {
    this.studentService.GetAllStudents(this.page, this.pageSize).subscribe((allData) => {
      const list = allData?.data?.dataList || [];
      const totalPages = allData?.data?.totalPages || 0;
      if (list.length === 0 && this.page > 0 && this.page >= totalPages) {
        this.page = Math.max(totalPages - 1, 0);
        this.GetAllStudents();
        return;
      }
      this.students = list;
      this.page = allData?.data?.page ?? this.page;
      this.totalPages = totalPages;
      this.totalElements = allData?.data?.totalElements || 0;
    });
  }

  goToPage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages || nextPage === this.page) {
      return;
    }
    this.page = nextPage;
    this.GetAllStudents();
  }

  changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = value;
    this.page = 0;
    this.GetAllStudents();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index);
  }

  DeleteById(ID: any) {
    swal({
      title: 'Are you sure',
      text: 'That you want to Delete this Student?',
      icon: 'warning',
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        swal('Deleted!', 'Order has been deleted!', 'success');
        this.studentService.DeleteStudentById(ID).subscribe((allData) => {
          this.GetAllStudents();
        });
      }
    });
  }

  GetAllStatus() {
    this.statusService.GetAllStatus().subscribe((allData) => {
      this.allStatus = allData.data.dataList;
    });
  }

  onChangeStatus(E: any) {
    this.studentObj.status = E.target.value;
  }
}
