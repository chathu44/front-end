import { Component } from '@angular/core';
import { EnrollmentRepresentation } from '../services/api/module/enrollment-representation';
import { EnrollmentService } from '../services/api/enrollment/enrollment.service';
import { StatusService } from '../services/api/status/status.service';
import swal from 'sweetalert';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  filterStatusOptions,
  findStatusById,
  normalizeLookupName,
  unwrapApiList,
  isActiveRecord,
  isOpenRecord,
  resolveRecordStatusName,
  scrollPageToTop,
} from '../services/lookup-utils';

@Component({
  selector: 'app-enrollment',
  standalone: false,
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss'],
})
export class EnrollmentComponent {
  tableFilters: { [key: string]: any } = {};

  enrollmentObj: EnrollmentRepresentation = {};

  enrollments: Array<any> = [];

  allChildList: Array<any> = [];
  private activeChildList: any[] = [];
  private allChildRecords: any[] = [];
  loadingPrograms = true;
  private selectedEnrollmentChild: any = null;
  private selectedEnrollmentChildId: any = null;
  allParentList: Array<any> = [];
  allProgramList: Array<any> = [];
  allClassroomList: Array<any> = [];
  childFilterOptions: any[] = [];
  parentFilterOptions: any[] = [];
  programFilterOptions: any[] = [];
  classroomFilterOptions: any[] = [];
  allStatus: Array<any> = [];
  private statusLookup$: Observable<any[]> | null = null;
  allChildList$ = new BehaviorSubject<any[]>([]);
  allProgramList$: Observable<any[]> = of([]);
  allClassroomList$: Observable<any[]> = of([]);
  enrollmentStatusOptions$: Observable<any[]> = of([]);

  type: string = '';

  isEditEnrollment: boolean = false;

  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  searchText: string = '';

  selectedEnrollmentId: any = null;

  constructor(
    private enrollmentService: EnrollmentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.ENROLLMENT_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.ENROLLMENT_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.ENROLLMENT_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.ENROLLMENT_DELETE);

    console.log('Enrollment permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.GetAllChildList();
    this.GetAllParentList();
    this.GetAllProgramList();
    this.GetAllClassroomList();
    this.GetAllStatus();
    this.GetAllEnrollments();
  }

  SaveEnrollment(): void {
    if (this.isEditEnrollment ? !this.canUpdate : !this.canCreate) {
      swal(
        'Permission denied',
        this.isEditEnrollment
          ? 'You do not have permission to update enrollments.'
          : 'You do not have permission to create enrollments.',
        'warning',
      );
      return;
    }

    const enrollDate = String(this.enrollmentObj.enrollDate ?? '').trim();
    const startDate = String(this.enrollmentObj.startDate ?? '').trim();
    const endDate = String(this.enrollmentObj.endDate ?? '').trim();
    const childId =
      this.enrollmentObj.child && typeof this.enrollmentObj.child === 'object'
        ? this.enrollmentObj.child.id
        : this.enrollmentObj.child;
    const programId =
      this.enrollmentObj.program &&
      typeof this.enrollmentObj.program === 'object'
        ? this.enrollmentObj.program.id
        : this.enrollmentObj.program;
    const classroomId =
      this.enrollmentObj.classroom &&
      typeof this.enrollmentObj.classroom === 'object'
        ? this.enrollmentObj.classroom.id
        : this.enrollmentObj.classroom;

    const parentId =
      this.enrollmentObj.parent && typeof this.enrollmentObj.parent === 'object'
        ? this.enrollmentObj.parent.id
        : this.enrollmentObj.parent;
    if (
      !enrollDate ||
      !startDate ||
      !childId ||
      !parentId ||
      !programId ||
      !classroomId
    ) {
      swal(
        'Validation error',
        'Choose a child with a registered parent, program, classroom, enrollment date, and start date.',
        'warning',
      );
      return;
    }
    if (startDate < enrollDate) {
      swal(
        'Validation error',
        'Enrollment start date cannot be earlier than the enrollment date.',
        'warning',
      );
      return;
    }
    if (endDate && endDate < startDate) {
      swal(
        'Validation error',
        'End date cannot be earlier than the start date.',
        'warning',
      );
      return;
    }

    this.enrollmentObj.child = childId;
    this.enrollmentObj.parent = parentId;
    this.enrollmentObj.program = programId;
    this.enrollmentObj.classroom = classroomId;
    this.enrollmentObj.enrollDate = enrollDate;
    this.enrollmentObj.startDate = startDate;
    this.enrollmentObj.endDate = endDate || undefined;

    this.type = this.isEditEnrollment ? 'Update' : 'Add';

    let statusId =
      this.enrollmentObj.status && typeof this.enrollmentObj.status === 'object'
        ? this.enrollmentObj.status.id
        : this.enrollmentObj.status;

    if (
      (statusId === null || statusId === undefined || statusId === '') &&
      this.type === 'Add'
    ) {
      const pendingStatus = this.allStatus.find(
        (status: any) =>
          normalizeLookupName(status?.name ?? status?.statusName) === 'pending',
      );
      statusId = pendingStatus?.id ?? null;
    }

    if (statusId === null || statusId === undefined || statusId === '') {
      swal(
        'Missing status',
        'Select a valid enrollment status before saving.',
        'warning',
      );
      return;
    }
    this.enrollmentObj.status = statusId;

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
    // The table already contains the complete enrollment DTO. Prefer that
    // record so Active rows do not depend on a second detail request.
    const tableRecord = this.enrollments.find(
      (item: any) => String(item?.id) === String(ID),
    );

    if (tableRecord) {
      this.loadEnrollmentRecord(tableRecord);
      return;
    }

    this.enrollmentService.GetEnrollmentById(ID).subscribe({
      next: (allData: any) => {
        const record =
          unwrapApiList(allData)[0] ??
          allData?.data?.dataList?.[0] ??
          allData?.data?.data ??
          allData?.data ??
          allData;

        if (!record || record.id == null) {
          swal(
            'Not Found',
            'The selected enrollment could not be found.',
            'warning',
          );
          return;
        }

        this.loadEnrollmentRecord(record);
      },
      error: (error: any) => {
        console.error('Unable to load enrollment details:', error);
        swal(
          'Error',
          'Unable to load this enrollment. Refresh the table and try again.',
          'error',
        );
      },
    });
  }

  private loadEnrollmentRecord(record: any): void {
    this.enrollmentObj = {
      ...record,
      child: record.child?.id ?? record.child ?? null,
      parent: record.parent?.id ?? record.parent ?? null,
      program: record.program?.id ?? record.program ?? null,
      classroom: record.classroom?.id ?? record.classroom ?? null,
      status: record.status?.id ?? record.status ?? null,
    };

    const selectedChildId = record.child?.id ?? record.child ?? null;
    this.selectedEnrollmentChildId = selectedChildId;
    this.selectedEnrollmentChild =
      this.allChildRecords.find(
        (child: any) => String(child.id) === String(selectedChildId),
      ) ||
      (record.child && typeof record.child === 'object'
        ? record.child
        : null);

    this.isEditEnrollment = true;
    this.allChildList = this.mergeSelectedEnrollmentChild(this.activeChildList);
    this.allChildList$.next(this.allChildList);
    this.selectedEnrollmentId = record.id;
    scrollPageToTop();
  }

  SelectEnrollmentRow(enrollment: any): void {
    if (!enrollment || enrollment.id == null) {
      return;
    }
    this.loadEnrollmentRecord(enrollment);
  }

  GetAllEnrollments(): void {
    this.enrollmentService.GetAllEnrollments().subscribe({
      next: (allData: any): void => {
        this.enrollments = unwrapApiList(allData);
      },

      error: (error: any): void => {
        console.error(error);

        swal('Error!', 'Unable to load registered enrollments.', 'error');
      },
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete enrollments.',
        'warning',
      );
      return;
    }
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

  private getStatusLookup(): Observable<any[]> {
    if (!this.statusLookup$) {
      this.statusLookup$ = this.statusService.GetAllStatus().pipe(
        map((response: any) => unwrapApiList(response)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.statusLookup$;
  }

  GetAllChildList(): void {
    forkJoin({
      children: this.enrollmentService.GetAllChildList().pipe(
        map((response: any) => unwrapApiList(response)),
      ),
      statuses: this.getStatusLookup(),
    }).subscribe({
      next: ({ children, statuses }: { children: any[]; statuses: any[] }) => {
        this.allStatus = statuses;
        this.allChildRecords = children;
        this.childFilterOptions = children.filter((child: any) => {
          const statusName = normalizeLookupName(resolveRecordStatusName(child, statuses));
          return ['active', 'withdrawn', 'graduated'].includes(statusName);
        });
        this.activeChildList = children
          .filter((child: any) => isActiveRecord(child, statuses))
          .map((child: any) => ({
            ...child,
            dropdownLabel: this.childDropdownLabel(child),
          }));
        this.allChildList = this.mergeSelectedEnrollmentChild(
          this.activeChildList,
        );
        this.allChildList$.next(this.allChildList);
      },
      error: (error: any) => {
        console.error('Unable to load children for enrollment:', error);
        this.allChildRecords = [];
        this.activeChildList = [];
        this.allChildList = [];
        this.allChildList$.next([]);
      },
    });
  }

  private childDropdownLabel(child: any): string {
    const name =
      [child?.firstName, child?.lastName].filter(Boolean).join(' ').trim() ||
      child?.fullName ||
      child?.name ||
      `Child #${child?.id ?? ''}`;
    const code = child?.childCode || `CH-${child?.id ?? ''}`;
    const status = resolveRecordStatusName(child, this.allStatus);
    const historicStatus =
      status && status.toLowerCase() !== 'active' ? ` · ${status}` : '';
    return `${name} · ${code}${historicStatus}`;
  }

  private mergeSelectedEnrollmentChild(activeItems: any[]): any[] {
    // Every option must have the label used by ng-select's bindLabel.
    const items = (activeItems || []).map((child: any) => ({
      ...child,
      dropdownLabel: child.dropdownLabel || this.childDropdownLabel(child),
    }));
    const historicChild =
      this.allChildRecords.find(
        (child: any) =>
          String(child.id) === String(this.selectedEnrollmentChildId),
      ) || this.selectedEnrollmentChild;
    if (!historicChild || historicChild.id == null) return items;
    const exists = items.some(
      (item: any) => String(item.id) === String(historicChild.id),
    );
    if (!exists) {
      items.push({
        ...historicChild,
        dropdownLabel: this.childDropdownLabel(historicChild),
      });
    }
    return items;
  }

  onChildSelection(childId: any): void {
    this.enrollmentObj.child =
      childId === '' || childId === null ? null : childId;

    if (
      this.selectedEnrollmentChildId != null &&
      String(childId) !== String(this.selectedEnrollmentChildId)
    ) {
      this.selectedEnrollmentChild = null;
      this.selectedEnrollmentChildId = null;
      this.allChildList = [...this.activeChildList];
      this.allChildList$.next(this.allChildList);
    }

    const selectedChild = this.allChildList.find(
      (child: any) => String(child.id) === String(childId),
    );

    if (!selectedChild) {
      this.enrollmentObj.parent = null;
      return;
    }

    const linkedParentId =
      selectedChild.parent?.id ?? selectedChild.parent ?? null;

    this.enrollmentObj.parent = linkedParentId;
  }

  GetAllParentList(): void {
    forkJoin({
      parents: this.enrollmentService.GetAllParentList().pipe(
        map((response: any) => unwrapApiList(response)),
      ),
      statuses: this.getStatusLookup(),
    }).subscribe({
      next: ({ parents, statuses }: { parents: any[]; statuses: any[] }): void => {
        this.allStatus = statuses;
        this.parentFilterOptions = parents.filter((item: any) => {
          const statusName = normalizeLookupName(resolveRecordStatusName(item, statuses));
          return statusName === 'active' || statusName === 'inactive';
        });
        this.allParentList = parents.filter((item: any) => isActiveRecord(item, statuses));
      },
      error: (error: any): void => console.error('Unable to load active parents', error),
    });
  }

  GetAllProgramList(): void {
    this.allProgramList$ = forkJoin({
      programs: this.enrollmentService.GetAllProgramList().pipe(
        map((response: any) => unwrapApiList(response)),
      ),
      statuses: this.getStatusLookup(),
    }).pipe(
      map(({ programs, statuses }: { programs: any[]; statuses: any[] }) => {
        this.allStatus = statuses;
        this.programFilterOptions = programs.filter((program: any) => {
          const statusName = normalizeLookupName(resolveRecordStatusName(program, statuses));
          return statusName === 'active' || statusName === 'inactive';
        });
        return programs.filter((program: any) => isActiveRecord(program, statuses));
      }),
      map((items: any[]) =>
        items.map((program: any) => ({
          ...program,
          dropdownLabel:
            program.programName || program.name || `Program #${program.id}`,
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.loadingPrograms = true;
    this.allProgramList$.subscribe({
      next: (items: any[]) => {
        this.allProgramList = items;
        this.loadingPrograms = false;
      },
      error: (error: any) => {
        console.error('Unable to load programs', error);
        this.allProgramList = [];
        this.loadingPrograms = false;
      },
    });
  }

  GetAllClassroomList(): void {
    this.allClassroomList$ = forkJoin({
      classrooms: this.enrollmentService.GetAllClassroomList().pipe(
        map((response: any) => unwrapApiList(response)),
      ),
      statuses: this.getStatusLookup(),
    }).pipe(
      map(({ classrooms, statuses }: { classrooms: any[]; statuses: any[] }) => {
        this.allStatus = statuses;
        // The table filter must search every classroom, including Closed ones.
        // Keep this separate from the enrollment form list, which intentionally
        // continues to offer only Open classrooms for new enrollments.
        this.classroomFilterOptions = classrooms.map((room: any) => ({ ...room }));
        return classrooms.filter((room: any) => isOpenRecord(room, statuses));
      }),
      map((items: any[]) =>
        items.map((room: any) => ({
          ...room,
          dropdownLabel: [
            room.roomName || room.classroomName || `Classroom #${room.id}`,
            room.roomCode || room.classroomCode,
          ]
            .filter(Boolean)
            .join(' · '),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allClassroomList$.subscribe({
      next: (items: any[]) => (this.allClassroomList = items),
      error: (error: any) => console.error('Unable to load classrooms', error),
    });
  }

  GetAllStatus(): void {
    const statuses$ = this.getStatusLookup();

    this.enrollmentStatusOptions$ = statuses$.pipe(
      map((statuses: any[]) =>
        filterStatusOptions(statuses, [
          'Pending',
          'Active',
          'Completed',
          'Withdrawn',
        ]),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    statuses$.subscribe({
      next: (statuses: any[]) => (this.allStatus = statuses),
      error: (error: any) => console.error('Unable to load statuses', error),
    });
  }

  statusOptionId(status: any): string | number | null {
    if (status && typeof status === 'object') return status.id ?? null;
    return status == null || status === '' ? null : status;
  }

  onEnrollmentStatusChange(enrollment: any, statusId: any): void {
    const selectedStatus = findStatusById(this.allStatus, statusId);
    if (!selectedStatus) {
      delete enrollment._pendingStatus;
      enrollment.statusChanged = false;
      return;
    }

    if (
      String(this.statusOptionId(enrollment.status)) ===
      String(selectedStatus.id)
    ) {
      delete enrollment._pendingStatus;
      enrollment.statusChanged = false;
      return;
    }

    enrollment._pendingStatus = selectedStatus;
    enrollment.statusChanged = true;
  }

  isEnrollmentActive(enrollment: any): boolean {
    const status = enrollment._pendingStatus ?? enrollment.status;

    return (
      this.normalizeStatusName(this.getEnrollmentStatusName(status)) ===
      'active'
    );
  }

  onStatusToggle(enrollment: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentlyActive = this.isEnrollmentActive(enrollment);

    const requestedStatus = input.checked ? 'Active' : 'Inactive';
    const selectedStatus = this.findEnrollmentStatus(requestedStatus);

    if (!selectedStatus || selectedStatus.id == null) {
      input.checked = currentlyActive;

      swal(
        'Status Not Available',
        `${requestedStatus} status was not found in the status list returned by the API.`,
        'warning',
      );

      return;
    }

    enrollment._pendingStatus = selectedStatus;
    enrollment.statusChanged = true;
  }

  saveEnrollmentStatus(enrollment: any): void {
    if (!this.canUpdate) {
      swal(
        'Permission denied',
        'You do not have permission to update enrollment status.',
        'warning',
      );
      return;
    }
    const selectedStatus = enrollment._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const payload: any = {
      ...enrollment,
      status: selectedStatus.id,
    };

    delete payload._pendingStatus;
    delete payload.statusChanged;

    this.enrollmentService.createEnrollment(payload, 'Update').subscribe({
      next: (): void => {
        swal('Successful!', 'Enrollment status has been updated!', 'success');

        this.GetAllEnrollments();
      },

      error: (error: any): void => {
        console.error('Enrollment status update error:', error);

        swal(
          'Error!',
          error?.error?.message ||
            error?.error?.error ||
            'Unable to update enrollment status.',
          'error',
        );

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
      return currentStatus.name || 'Pending';
    }

    const status = this.allStatus.find(
      (item: any) => String(item.id) === String(currentStatus),
    );

    return status?.name || 'Pending';
  }

  ClearForm(): void {
    this.enrollmentObj = {};

    const pendingStatus = this.allStatus.find(
      (status: any) =>
        normalizeLookupName(status?.name ?? status?.statusName) === 'pending',
    );
    if (pendingStatus) this.enrollmentObj.status = pendingStatus.id;

    this.isEditEnrollment = false;
    this.selectedEnrollmentChild = null;
    this.selectedEnrollmentChildId = null;
    this.allChildList = [...this.activeChildList];
    this.allChildList$.next(this.allChildList);

    this.type = '';

    this.selectedEnrollmentId = null;
  }
  private normalizeStatusName(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  private getEnrollmentStatusName(status: any): string {
    if (status && typeof status === 'object') {
      const name = status.name ?? status.statusName ?? status.label;

      if (name) {
        return String(name);
      }

      status = status.id;
    }

    const match = this.allStatus.find(
      (item: any) => String(item.id) === String(status),
    );

    return String(match?.name ?? match?.statusName ?? '');
  }

  private findEnrollmentStatus(name: string): any {
    const expected = this.normalizeStatusName(name);

    return this.allStatus.find((status: any) => {
      const actual = status?.name ?? status?.statusName ?? status?.label ?? '';

      return this.normalizeStatusName(actual) === expected;
    });
  }
}
