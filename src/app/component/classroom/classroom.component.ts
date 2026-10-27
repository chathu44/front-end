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

import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  filterStatusOptions,
  findStatusById,
  normalizeLookupName,
  unwrapApiList,
  scrollPageToTop,
} from '../services/lookup-utils';

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
  classroomStatusOptions$: Observable<any[]> = of([]);
  statusValue: any;
  type = '';
  isEditClassroom = false;
  dtDynamicVerticalScrollExample: any;
  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  readonly ageGroupOptions = [
    '0-1 Years',
    '1-2 Years',
    '2-3 Years',
    '3-5 Years',
    '5+ Years',
  ];
  readonly floorOptions = [
    'Ground Floor',
    '1st Floor',
    '2nd Floor',
    '3rd Floor',
  ];

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

    const roomName = String(this.classroomObj.roomName ?? '').trim();
    const capacity = Number(this.classroomObj.capacity);
    if (roomName.length < 2 || roomName.length > 100) {
      swal(
        'Validation error',
        'Classroom name must contain 2–100 characters.',
        'warning',
      );
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
      swal(
        'Validation error',
        'Capacity must be a whole number between 1 and 200.',
        'warning',
      );
      return;
    }
    this.classroomObj.roomName = roomName;
    this.classroomObj.capacity = capacity;

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
        scrollPageToTop();
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
              error?.error?.message ||
                (error?.status === 403
                  ? 'The API denied deletion. Confirm CLASSROOM_DELETE exists and is assigned to your user or privilege group, then sign in again.'
                  : error?.status === 409 || error?.status === 500
                    ? 'The classroom may be referenced by enrollments, attendance, or meal plans. Close it instead of deleting it when history exists.'
                    : 'Unable to delete classroom. Check the Network tab and Spring Boot console.'),
              'error',
            );
          },
        });
      }
    });
  }

  GetAllStatus(): void {
    const statuses$ = this.statusService.GetAllStatus().pipe(
      map((response: any) => unwrapApiList(response)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.classroomStatusOptions$ = statuses$.pipe(
      map((statuses: any[]) =>
        filterStatusOptions(statuses, ['Open', 'Full', 'Closed']),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    statuses$.subscribe({
      next: (statuses: any[]): void => {
        this.allStatus = statuses;
        if (!this.isEditClassroom && !this.classroomObj.status) {
          const openStatus = statuses.find(
            (status: any) =>
              normalizeLookupName(status?.name ?? status?.statusName) ===
              'open',
          );
          if (openStatus) {
            this.classroomObj.status = openStatus.id;
            this.statusValue = openStatus.name ?? openStatus.statusName;
          }
        }
      },
      error: (error: any): void => {
        console.error('Get statuses error:', error);
        this.allStatus = [];
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
    this.statusValue = 'Open';
    this.isEditClassroom = false;

    const openStatus = this.allStatus.find(
      (status: any) =>
        normalizeLookupName(status?.name ?? status?.statusName) === 'open',
    );

    if (openStatus) {
      this.classroomObj.status = openStatus.id;
      this.statusValue = openStatus.name ?? openStatus.statusName ?? 'Open';
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
    scrollPageToTop();
  }

  statusOptionId(status: any): string | number | null {
    if (status && typeof status === 'object') return status.id ?? null;
    return status == null || status === '' ? null : status;
  }

  onClassroomStatusChange(classroom: any, statusId: any): void {
    const selectedStatus = findStatusById(this.allStatus, statusId);
    if (!selectedStatus) {
      delete classroom._pendingStatus;
      classroom.statusChanged = false;
      return;
    }

    if (
      String(this.statusOptionId(classroom.status)) ===
      String(selectedStatus.id)
    ) {
      delete classroom._pendingStatus;
      classroom.statusChanged = false;
      return;
    }

    classroom._pendingStatus = selectedStatus;
    classroom.statusChanged = true;
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
