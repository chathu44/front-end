import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StudentService } from '../services/api/student/student.service';
import { CourseService } from '../services/api/course/course.service';
import { ClassRepresentation } from '../services/api/module/class-representation';
import { ClassService } from '../services/api/student_course/class.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.scss']
})
export class ClassComponent implements OnInit {
  @ViewChild('classFormModal') classFormModal!: TemplateRef<any>;

  classObj: ClassRepresentation = {};
  type: string = 'Add';
  classId: any;
  allCourses: any[] = [];
  courseValue: any;
  allStudents: any[] = [];
  courseId: string = '';
  studentValue: any;
  isEditClass = false;
  classes: Array<any> = [];
  searchText = '';
  selectedCourseFilter: string | null = null;

  private modalRef?: NgbModalRef;

  constructor(
    private studentService: StudentService,
    private courseService: CourseService,
    private classService: ClassService,
    private modalService: NgbModal,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.isEditClass = false;
    this.GetAllStudents();
    this.GetAllCourse();
  }

  get filteredClasses(): any[] {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      return this.classes;
    }
    return this.classes.filter(c =>
      String(c.studentName || '').toLowerCase().includes(q) ||
      String(c.studentCode || '').toLowerCase().includes(q)
    );
  }

  GetAllStudents(): void {
    this.studentService.GetAllStudents().subscribe({
      next: (allData) => this.allStudents = allData?.data?.dataList || [],
      error: () => this.toast.error('Failed to load students')
    });
  }

  GetAllCourse(): void {
    this.courseService.GetAllCourses().subscribe({
      next: (allData) => this.allCourses = allData?.data?.dataList || [],
      error: () => this.toast.error('Failed to load courses')
    });
  }

  openAddModal(): void {
    this.isEditClass = false;
    this.type = 'Add';
    this.classObj = {};
    this.studentValue = null;
    this.courseValue = null;
    this.modalRef = this.modalService.open(this.classFormModal, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
  }

  openEditModal(classRow: any): void {
    if (!this.courseId) {
      this.toast.error('Select a course filter first, then edit a row');
      return;
    }

    this.classService.GetClassIdByCourseAndStudent(classRow.id, this.courseId).subscribe({
      next: (allData) => {
        this.classId = allData?.data?.dataList?.[0]?.id;
        if (!this.classId) {
          this.toast.error('Could not find class record');
          return;
        }

        this.classService.GetClassById(this.classId).subscribe({
          next: (detail) => {
            this.classObj = detail?.data?.dataList?.[0] || {};
            this.isEditClass = true;
            this.type = 'Update';
            this.studentValue = detail?.data?.dataList?.[0]?.studentId?.studentName;
            this.courseValue = detail?.data?.dataList?.[0]?.courseId?.courseName;
            this.classObj.studentName = this.studentValue;
            this.classObj.courseName = this.courseValue;

            this.modalRef = this.modalService.open(this.classFormModal, {
              centered: true,
              backdrop: 'static',
              size: 'md'
            });
          },
          error: () => this.toast.error('Failed to load class details')
        });
      },
      error: () => this.toast.error('Failed to load class record')
    });
  }

  onChangeStudent(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.classObj.studentName = value;
  }

  onChangeCourse(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.classObj.courseName = value;
  }

  SaveClass(): void {
    if (!this.classObj.studentName || !this.classObj.courseName) {
      this.toast.error('Please select student and course');
      return;
    }

    this.type = this.isEditClass ? 'Update' : 'Add';

    this.classService.createClass(this.classObj, this.type).subscribe({
      next: () => {
        this.toast.success(this.isEditClass ? 'Class updated' : 'Class registered');
        this.modalRef?.close();
        this.resetForm();
        if (this.courseId) {
          this.reloadGrid(this.courseId);
        }
      },
      error: () => this.toast.error('Failed to save class registration')
    });
  }

  DeleteById(studentID: any): void {
    if (!this.courseId) {
      this.toast.error('Select a course filter first');
      return;
    }

    this.classService.GetClassIdByCourseAndStudent(studentID, this.courseId).subscribe({
      next: (allData) => {
        this.classId = allData?.data?.dataList?.[0]?.id;
        if (!this.classId) {
          this.toast.error('Could not find class record');
          return;
        }

        this.classService.DeleteClassById(this.classId).subscribe({
          next: () => {
            this.toast.success('Class registration deleted');
            this.reloadGrid(this.courseId);
          },
          error: () => this.toast.error('Failed to delete class')
        });
      },
      error: () => this.toast.error('Failed to delete class')
    });
  }

  onChangeCourseName(event: Event): void {
    this.courseId = (event.target as HTMLSelectElement).value;
    this.reloadGrid(this.courseId);
  }

  private reloadGrid(courseId: string): void {
    this.classService.GetStudentForClass(courseId).subscribe({
      next: (allData) => this.classes = allData?.data?.dataList || [],
      error: () => {
        this.classes = [];
        this.toast.error('Failed to load class list');
      }
    });
  }

  private resetForm(): void {
    this.isEditClass = false;
    this.type = 'Add';
    this.classObj = {};
    this.studentValue = null;
    this.courseValue = null;
  }
}
