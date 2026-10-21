import { Component, OnInit } from '@angular/core';
import { ClassroomRepresentation } from '../services/api/module/classroom-representation';
import { ClassroomService } from '../services/api/classroom/classroom.service';
import { StatusService } from '../services/api/status/status.service';
import { FormBuilder } from '@angular/forms';
import swal from 'sweetalert';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

@Component({
  selector: 'app-classroom',
  standalone: false,
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss'],
})
export class ClassroomComponent implements OnInit {
  classroomObj: ClassroomRepresentation = {};
  classrooms: Array<any> = [];
  allStatus: Array<any> = [];
  statusValue: any;
  type = '';
  isEditClassroom = false;
  dtDynamicVerticalScrollExample: any;
  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private classroomService: ClassroomService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.CLASSROOM_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.CLASSROOM_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.CLASSROOM_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.CLASSROOM_DELETE);

    console.log('Classroom permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.GetAllStatus();
    this.GetAllClassrooms();
  }

  SaveClassroom(): void {
    if (this.isEditClassroom ? !this.canUpdate : !this.canCreate) {
      swal(
        'Permission denied',
        this.isEditClassroom
          ? 'You do not have permission to update classrooms.'
          : 'You do not have permission to create classrooms.',
        'warning',
      );
      return;
    }
    this.type = this.isEditClassroom ? 'Update' : 'Add';

    const statusId = this.getStatusId(this.classroomObj.status);

    if (statusId === null || statusId === undefined || statusId === '') {
      swal('Missing Status', 'Please select a status.', 'warning');
      return;
    }

    const classroomToSave: ClassroomRepresentation = {
      ...this.classroomObj,
      status: statusId,
    };

    const saveClassroom = (): void => {
      this.classroomService
        .createClassroom(classroomToSave, this.type)
        .subscribe({
          next: (): void => {
            swal(
              'Successful!',
              this.type === 'Add'
                ? 'Classroom has been added!'
                : 'Classroom has been updated!',
              'success',
            );
            this.GetAllClassrooms();
            this.ClearForm();
          },
          error: (error: any): void => {
            console.error('Classroom save error:', error);
            swal(
              'Error!',
              error?.error?.message ||
                error?.error?.error ||
                'Unable to save classroom. Please check the entered details.',
              'error',
            );
          },
        });
    };

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'Do you want to add this classroom?',
        icon: 'warning',
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          saveClassroom();
        }
      });
    } else {
      saveClassroom();
    }
  }

  private getStatusId(status: any): string | number | null {
    if (status && typeof status === 'object') {
      return status.id ?? null;
    }

    return status === '' || status === undefined ? null : status;
  }

  GetClassroomById(ID: any): void {
    this.classroomService.GetClassroomById(ID).subscribe({
      next: (allData: any): void => {
        const record = allData?.data?.dataList?.[0];

        if (!record) {
          swal('Error!', 'Classroom record was not found.', 'error');
          return;
        }

        this.classroomObj = {
          ...record,
          status: record.status?.id ?? record.status ?? null,
        };

        this.statusValue = record.status?.name || 'Select Value';
        this.isEditClassroom = true;

        this.selectedClassroomId = record.id;
      },
      error: (error: any): void => {
        console.error('Get classroom error:', error);
        swal('Error!', 'Unable to load classroom details.', 'error');
      },
    });
  }

  GetAllClassrooms(): void {
    this.classroomService.GetAllClassrooms().subscribe({
      next: (allData: any): void => {
        this.classrooms = allData?.data?.dataList || [];
      },
      error: (error: any): void => {
        console.error('Get classrooms error:', error);
        swal('Error!', 'Unable to load classrooms.', 'error');
      },
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete classrooms.',
        'warning',
      );
      return;
    }
    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this classroom?',
      icon: 'warning',
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        this.classroomService.DeleteClassroomById(ID).subscribe({
          next: (): void => {
            swal('Deleted!', 'Classroom has been deleted!', 'success');
            this.GetAllClassrooms();
          },
          error: (error: any): void => {
            console.error('Delete classroom error:', error);
            swal(
              'Error!',
              error?.error?.message || 'Unable to delete classroom.',
              'error',
            );
          },
        });
      }
    });
  }

  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe({
      next: (allData: any): void => {
        this.allStatus = allData?.data?.dataList || [];

        if (!this.isEditClassroom && !this.classroomObj.status) {
          const activeStatus = this.allStatus.find(
            (status: any) => String(status.name).toLowerCase() === 'active',
          );

          if (activeStatus) {
            this.classroomObj.status = activeStatus.id;
          }
        }
      },
      error: (error: any): void => {
        console.error('Get statuses error:', error);
        swal('Error!', 'Unable to load statuses.', 'error');
      },
    });
  }

  onChangeStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.classroomObj.status = select.value === '' ? null : select.value;
  }

  ClearForm(): void {
    this.classroomObj = {};
    this.statusValue = 'Select Value';
    this.isEditClassroom = false;

    const activeStatus = this.allStatus.find(
      (status: any) => String(status.name).toLowerCase() === 'active',
    );

    if (activeStatus) {
      this.classroomObj.status = activeStatus.id;
    }
    this.selectedClassroomId = null;
  }

  searchText: string = '';
  selectedClassroomId: any = null;

  get filteredClassrooms(): any[] {
    const search = this.searchText.trim().toLowerCase();

    return (this.classrooms || []).filter((classroom: any) => {
      const name = String(classroom.roomName || '').toLowerCase();
      const code = String(classroom.roomCode || '').toLowerCase();
      const ageGroup = String(classroom.ageGroup || '').toLowerCase();
      const floor = String(classroom.floor || '').toLowerCase();

      return (
        name.includes(search) ||
        code.includes(search) ||
        ageGroup.includes(search) ||
        floor.includes(search)
      );
    });
  }

  SelectClassroomRow(classroom: any): void {
    this.selectedClassroomId = classroom.id;

    this.classroomObj = {
      ...classroom,
      status: this.getStatusId(classroom.status),
    };

    this.statusValue = this.getStatusName(classroom.status) || 'Select Value';

    this.isEditClassroom = true;
  }

  isClassroomActive(classroom: any): boolean {
    const status = classroom._pendingStatus ?? classroom.status;

    return this.normalizeStatusName(this.getStatusName(status)) === 'active';
  }

  onStatusToggle(classroom: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentlyActive = this.isClassroomActive(classroom);

    const requestedStatus = input.checked ? 'Active' : 'Inactive';
    const selectedStatus = this.findStatusByName(requestedStatus);

    if (!selectedStatus || selectedStatus.id == null) {
      input.checked = currentlyActive;

      swal(
        'Status Not Available',
        `${requestedStatus} status was not found in the status list returned by the API.`,
        'warning',
      );

      return;
    }

    classroom._pendingStatus = selectedStatus;
    classroom.statusChanged = true;
  }

  saveClassroomStatus(classroom: any): void {
    if (!this.canUpdate) {
      swal(
        'Permission denied',
        'You do not have permission to update classroom status.',
        'warning',
      );
      return;
    }
    const selectedStatus = classroom._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const payload: any = {
      ...classroom,
      status: selectedStatus.id,
    };

    delete payload._pendingStatus;
    delete payload.statusChanged;

    this.classroomService.createClassroom(payload, 'Update').subscribe({
      next: (): void => {
        classroom.status = selectedStatus;

        delete classroom._pendingStatus;
        delete classroom.statusChanged;

        swal('Successful!', 'Classroom status has been updated!', 'success');

        this.GetAllClassrooms();
      },

      error: (error: any): void => {
        console.error('Classroom status update error:', error);

        delete classroom._pendingStatus;
        delete classroom.statusChanged;

        swal('Error!', 'Unable to update classroom status.', 'error');

        this.GetAllClassrooms();
      },
    });
  }

  private normalizeStatusName(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  private findStatusByName(name: string): any {
    const expectedName = this.normalizeStatusName(name);

    return (this.allStatus || []).find((status: any) => {
      const actualName =
        status?.name ?? status?.statusName ?? status?.label ?? '';

      return this.normalizeStatusName(actualName) === expectedName;
    });
  }

  private getStatusName(status: any): string {
    if (status && typeof status === 'object') {
      const directName = status.name ?? status.statusName ?? status.label;

      if (directName) {
        return String(directName);
      }

      status = status.id;
    }

    const matchedStatus = (this.allStatus || []).find(
      (item: any) => String(item.id) === String(status),
    );

    return String(
      matchedStatus?.name ?? matchedStatus?.statusName ?? status ?? '',
    );
  }
}
