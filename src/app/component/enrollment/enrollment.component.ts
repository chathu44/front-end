import { Component } from '@angular/core';
import { EnrollmentRepresentation } from '../services/api/module/enrollment-representation';
import { EnrollmentService } from '../services/api/enrollment/enrollment.service';
import { StatusService } from '../services/api/status/status.service';
import swal from 'sweetalert';

@Component({
  selector: 'app-enrollment',
  standalone: false,
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss'],
})
export class EnrollmentComponent {
  enrollmentObj: EnrollmentRepresentation = {};

  enrollments: Array<any> = [];

  allChildList: Array<any> = [];
  allParentList: Array<any> = [];
  allProgramList: Array<any> = [];
  allClassroomList: Array<any> = [];
  allStatus: Array<any> = [];

  type: string = '';

  isEditEnrollment: boolean = false;

  canCreate: boolean = true;
  canUpdate: boolean = true;
  canDelete: boolean = true;

  searchText: string = '';

  selectedEnrollmentId: any = null;

  constructor(
    private enrollmentService: EnrollmentService,
    private statusService: StatusService,
  ) {}

  ngOnInit(): void {
    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;

    this.GetAllChildList();
    this.GetAllParentList();
    this.GetAllProgramList();
    this.GetAllClassroomList();
    this.GetAllStatus();
    this.GetAllEnrollments();
  }

  SaveEnrollment(): void {
    this.type = this.isEditEnrollment ? 'Update' : 'Add';

    if (
      this.type === 'Add' &&
      (this.enrollmentObj.status === null ||
        this.enrollmentObj.status === undefined ||
        this.enrollmentObj.status === '')
    ) {
      const activeStatus = this.allStatus.find(
        (status: any) => String(status.name).toLowerCase() === 'active',
      );

      if (!activeStatus) {
        swal(
          'Error!',
          'Active status was not found. Check your status records.',
          'error',
        );

        return;
      }

      this.enrollmentObj.status = activeStatus.id;
    }

    if (this.type === 'Add') {
      swal({
        title: 'Register Enrollment?',
        text: 'Do you want to register this enrollment?',
        icon: 'warning',
        dangerMode: true,
      }).then((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.enrollmentService
          .createEnrollment(this.enrollmentObj, 'Add')
          .subscribe({
            next: (result: any): void => {
              this.GetAllEnrollments();
              this.ClearForm();

              swal('Successful!', 'Enrollment has been registered!', 'success');
            },

            error: (error: any): void => {
              console.error(error);

              swal(
                'Error!',
                'Unable to register enrollment. Please check the selected child, parent, program, classroom, dates, and API response.',
                'error',
              );
            },
          });
      });
    } else {
      this.enrollmentService
        .createEnrollment(this.enrollmentObj, 'Update')
        .subscribe({
          next: (result: any): void => {
            this.GetAllEnrollments();
            this.ClearForm();

            swal('Successful!', 'Enrollment has been updated!', 'success');
          },

          error: (error: any): void => {
            console.error(error);

            swal('Error!', 'Unable to update enrollment.', 'error');
          },
        });
    }
  }

  GetEnrollmentById(ID: any): void {
    this.enrollmentService.GetEnrollmentById(ID).subscribe((allData: any) => {
      const record = allData?.data?.dataList?.[0];

      if (!record) {
        swal(
          'Not Found',
          'The selected enrollment could not be found.',
          'warning',
        );

        return;
      }

      this.enrollmentObj = {
        ...record,

        child: record.child?.id ?? record.child ?? null,

        parent: record.parent?.id ?? record.parent ?? null,

        program: record.program?.id ?? record.program ?? null,

        classroom: record.classroom?.id ?? record.classroom ?? null,

        status: record.status?.id ?? record.status ?? null,
      };

      this.isEditEnrollment = true;

      this.selectedEnrollmentId = record.id;
    });
  }

  SelectEnrollmentRow(enrollment: any): void {
    this.selectedEnrollmentId = enrollment.id;

    this.GetEnrollmentById(enrollment.id);
  }

  GetAllEnrollments(): void {
    this.enrollmentService.GetAllEnrollments().subscribe({
      next: (allData: any): void => {
        this.enrollments = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);

        swal('Error!', 'Unable to load registered enrollments.', 'error');
      },
    });
  }

  DeleteById(ID: any): void {
    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this enrollment?',
      icon: 'warning',
      dangerMode: true,
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.enrollmentService.DeleteEnrollmentById(ID).subscribe({
        next: (result: any): void => {
          if (String(this.selectedEnrollmentId) === String(ID)) {
            this.ClearForm();
          }

          this.GetAllEnrollments();

          swal('Deleted!', 'Enrollment has been deleted!', 'success');
        },

        error: (error: any): void => {
          console.error(error);

          swal(
            'Error!',
            'Unable to delete enrollment. It may be linked to other records.',
            'error',
          );
        },
      });
    });
  }

  GetAllChildList(): void {
    this.enrollmentService.GetAllChildList().subscribe({
      next: (allData: any): void => {
        this.allChildList = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);
      },
    });
  }

  onChildSelection(childId: any): void {
    this.enrollmentObj.child =
      childId === '' || childId === null ? null : childId;

    const selectedChild = this.allChildList.find(
      (child: any) => String(child.id) === String(childId),
    );

    if (!selectedChild) {
      this.enrollmentObj.parent = null;
      return;
    }

    // Automatically retrieve the parent's ID
    // from the selected child's registration.
    const linkedParentId =
      selectedChild.parent?.id ?? selectedChild.parent ?? null;

    this.enrollmentObj.parent = linkedParentId;
  }
  
  GetAllParentList(): void {
    this.enrollmentService.GetAllParentList().subscribe({
      next: (allData: any): void => {
        this.allParentList = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);
      },
    });
  }

  GetAllProgramList(): void {
    this.enrollmentService.GetAllProgramList().subscribe({
      next: (allData: any): void => {
        this.allProgramList = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);
      },
    });
  }

  GetAllClassroomList(): void {
    this.enrollmentService.GetAllClassroomList().subscribe({
      next: (allData: any): void => {
        this.allClassroomList = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);
      },
    });
  }

  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe({
      next: (allData: any): void => {
        this.allStatus = allData?.data?.dataList || [];
      },

      error: (error: any): void => {
        console.error(error);
      },
    });
  }

  isEnrollmentActive(enrollment: any): boolean {
    return String(enrollment.status?.name || '').toLowerCase() === 'active';
  }

  onStatusToggle(enrollment: any, event: Event): void {
    const input = event.target as HTMLInputElement;

    const newStatusName = input.checked ? 'Active' : 'Inactive';

    const selectedStatus = this.allStatus.find(
      (status: any) =>
        String(status.name).toLowerCase() === newStatusName.toLowerCase(),
    );

    if (!selectedStatus) {
      swal('Error!', `${newStatusName} status was not found.`, 'error');

      this.GetAllEnrollments();
      return;
    }

    enrollment.status = selectedStatus;
    enrollment.statusChanged = true;
  }

  saveEnrollmentStatus(enrollment: any): void {
    const enrollmentToUpdate: EnrollmentRepresentation = {
      ...enrollment,
      status: enrollment.status?.id,
    };

    this.enrollmentService
      .createEnrollment(enrollmentToUpdate, 'Update')
      .subscribe({
        next: (result: any): void => {
          enrollment.statusChanged = false;

          swal('Successful!', 'Enrollment status has been updated!', 'success');

          this.GetAllEnrollments();
        },

        error: (error: any): void => {
          console.error(error);

          swal('Error!', 'Unable to update enrollment status.', 'error');

          this.GetAllEnrollments();
        },
      });
  }

  formatDate(date: any): string {
    return date ? String(date).slice(0, 10) : '-';
  }

  get filteredEnrollments(): any[] {
    if (!this.enrollments) {
      return [];
    }

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.enrollments;
    }

    return this.enrollments.filter((enrollment: any) => {
      const code = String(
        enrollment.enrollmentCode || enrollment.id || '',
      ).toLowerCase();

      const childName = `${enrollment.child?.firstName || ''} ${
        enrollment.child?.lastName || ''
      }`.toLowerCase();

      const childCode = String(
        enrollment.child?.childCode || enrollment.child?.id || '',
      ).toLowerCase();

      const parentName = String(
        enrollment.parent?.fullName || '',
      ).toLowerCase();

      const programName = String(
        enrollment.program?.programName || '',
      ).toLowerCase();

      const classroomName = String(
        enrollment.classroom?.roomName || '',
      ).toLowerCase();

      return (
        code.includes(search) ||
        childName.includes(search) ||
        childCode.includes(search) ||
        parentName.includes(search) ||
        programName.includes(search) ||
        classroomName.includes(search)
      );
    });
  }

  get selectedChildName(): string {
    const child = this.allChildList.find(
      (item: any) =>
        String(item.id) ===
        String(this.enrollmentObj.child?.id ?? this.enrollmentObj.child),
    );

    return child
      ? `${child.firstName || ''} ${child.lastName || ''}`.trim()
      : '';
  }

  get selectedParentName(): string {
    const parent = this.allParentList.find(
      (item: any) =>
        String(item.id) ===
        String(this.enrollmentObj.parent?.id ?? this.enrollmentObj.parent),
    );

    return parent?.fullName || '';
  }

  get selectedProgramName(): string {
    const program = this.allProgramList.find(
      (item: any) =>
        String(item.id) ===
        String(this.enrollmentObj.program?.id ?? this.enrollmentObj.program),
    );

    return program?.programName || '';
  }

  get selectedClassroomName(): string {
    const classroom = this.allClassroomList.find(
      (item: any) =>
        String(item.id) ===
        String(
          this.enrollmentObj.classroom?.id ?? this.enrollmentObj.classroom,
        ),
    );

    return classroom?.roomName || '';
  }

  get selectedStatusName(): string {
    const currentStatus = this.enrollmentObj.status;

    if (currentStatus && typeof currentStatus === 'object') {
      return currentStatus.name || 'Active by default';
    }

    const status = this.allStatus.find(
      (item: any) => String(item.id) === String(currentStatus),
    );

    return status?.name || 'Active by default';
  }

  ClearForm(): void {
    this.enrollmentObj = {};

    this.isEditEnrollment = false;

    this.type = '';

    this.selectedEnrollmentId = null;
  }
}
