import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StaffService } from '../services/api/staff/staff.service';
import { StaffRepresentation } from '../services/api/module/staff-representation';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

type StaffFormMode = 'add' | 'view' | 'edit';

@Component({
  selector: 'app-staff',
  standalone: false,
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
})
export class StaffComponent implements OnInit {
  canView = false;
  canCreate = false;
  canUpdate = false;

  staffList: StaffRepresentation[] = [];
  classrooms: any[] = [];
  statuses: any[] = [];

  staffObj: StaffRepresentation = this.emptyStaff();
  mode: StaffFormMode = 'add';

  staffSearch = '';

  loading = false;
  saving = false;

  message = '';
  messageIsError = false;

  readonly roles: string[] = [
    'Caregiver',
    'Assistant Teacher',
    'Teacher',
    'Receptionist',
  ];

  readonly today = this.localDate(new Date());

  constructor(
    private staffService: StaffService,
    private permissionHelper: PermissionHelperService,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.STAFF_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.STAFF_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.STAFF_UPDATE);

    if (this.canView) {
      this.loadLookups();
      this.refreshStaff();
    }
  }

  get canSave(): boolean {
    if (this.mode === 'view') {
      return false;
    }

    return this.mode === 'add' ? this.canCreate : this.canUpdate;
  }

  get pageTitle(): string {
    if (this.mode === 'add') {
      return 'Staff Registration Form';
    }

    if (this.mode === 'edit') {
      return 'Edit Staff Details';
    }

    return 'Staff Details';
  }

  private emptyStaff(): StaffRepresentation {
    return {
      staffCode: '',
      userId: null,
      fullName: '',
      role: 'Caregiver',
      phone: '',
      nic: '',
      hireDate: '',
      classroom: null,
      status: null,
    };
  }

  private loadLookups(): void {
    forkJoin({
      classrooms: this.staffService.getClassrooms().pipe(
        map((response: any) => this.unwrapList(response)),
        catchError((error: any) => {
          console.error('Could not load classrooms:', error);
          return of([]);
        }),
      ),

      statuses: this.staffService.getStatuses().pipe(
        map((response: any) => this.unwrapList(response)),
        catchError((error: any) => {
          console.error('Could not load statuses:', error);
          return of([]);
        }),
      ),
    }).subscribe({
      next: (result: { classrooms: any[]; statuses: any[] }) => {
        this.classrooms = result.classrooms.map((item: any) => ({
          ...item,
          displayLabel: this.classroomLabel(item),
        }));

        this.statuses = result.statuses;

        if (this.mode === 'add' && !this.staffObj.status) {
          const activeStatus = this.statuses.find(
            (item: any) => String(item.name || '').toLowerCase() === 'active',
          );

          if (activeStatus) {
            this.staffObj.status = activeStatus.id;
          }
        }
      },
      error: (error: any) => {
        console.error('Could not load staff lookup data:', error);
      },
    });
  }

  private unwrapList(response: any): any[] {
    const candidates = [
      response?.data?.dataList,
      response?.dataList,
      response?.data?.items,
      response?.data?.content,
      response?.items,
      response?.content,
      response?.data,
      response,
    ];

    return candidates.find((value: any) => Array.isArray(value)) || [];
  }

  private unwrapOne(response: any): any {
    const rows = this.unwrapList(response);

    if (rows.length > 0) {
      return rows[0];
    }

    return response?.data?.data ?? response?.data ?? response;
  }

  refreshStaff(): void {
    if (!this.canView) {
      return;
    }

    this.loading = true;
    this.message = '';

    this.staffService.getAllStaff().subscribe({
      next: (response: any) => {
        this.staffList = this.unwrapList(response);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load staff:', error);

        this.staffList = [];
        this.loading = false;

        this.showMessage(
          'Could not load staff. Check the staff API endpoint.',
          true,
        );
      },
    });
  }

  newStaff(): void {
    this.mode = 'add';
    this.staffObj = this.emptyStaff();
    this.message = '';

    const activeStatus = this.statuses.find(
      (item: any) => String(item.name || '').toLowerCase() === 'active',
    );

    if (activeStatus) {
      this.staffObj.status = activeStatus.id;
    }

    this.scrollToForm();
  }

  selectStaff(row: StaffRepresentation, mode: StaffFormMode = 'view'): void {
    if (row.id === null || row.id === undefined) {
      this.populateStaff(row, mode);
      return;
    }

    this.staffService.getStaffById(row.id).subscribe({
      next: (response: any) => {
        const staff = this.unwrapOne(response);
        this.populateStaff(staff || row, mode);
      },
      error: (error: any) => {
        console.error('Could not load individual staff record:', error);

        this.populateStaff(row, mode);
      },
    });
  }

  private populateStaff(staff: StaffRepresentation, mode: StaffFormMode): void {
    this.staffObj = {
      ...staff,
      staffCode: staff.staffCode || '',
      userId: staff.userId ?? (staff as any).user?.id ?? null,
      fullName: staff.fullName || '',
      role: staff.role || 'Caregiver',
      phone: staff.phone || '',
      nic: staff.nic || '',
      hireDate: String(staff.hireDate || '').slice(0, 10),
      classroom: this.relationId(staff.classroom ?? (staff as any).classroomId),
      status: this.relationId(staff.status ?? (staff as any).statusId),
    };

    this.mode = mode;
    this.message = '';
    this.scrollToForm();
  }

  saveStaff(): void {
    if (!this.canSave) {
      this.showMessage(
        'You do not have permission to save this staff record.',
        true,
      );
      return;
    }

    const fullName = String(this.staffObj.fullName || '').trim();
    const role = String(this.staffObj.role || '').trim();
    const phone = String(this.staffObj.phone || '').trim();
    const nic = String(this.staffObj.nic || '').trim();
    const hireDate = String(this.staffObj.hireDate || '').trim();
    const staffCode =
      String(this.staffObj.staffCode || '').trim() || this.generateStaffCode();

    const userId =
      this.staffObj.userId === '' ||
      this.staffObj.userId === null ||
      this.staffObj.userId === undefined
        ? null
        : Number(this.staffObj.userId);

    const classroomId = this.relationId(this.staffObj.classroom);
    const statusId = this.relationId(this.staffObj.status);

    if (!fullName || !role) {
      this.showMessage('Full name and role are required.', true);
      return;
    }

    if (fullName.length > 150) {
      this.showMessage('Full name cannot exceed 150 characters.', true);
      return;
    }

    if (staffCode.length > 50) {
      this.showMessage('Staff code cannot exceed 50 characters.', true);
      return;
    }

    if (phone.length > 20) {
      this.showMessage('Phone cannot exceed 20 characters.', true);
      return;
    }

    if (nic.length > 20) {
      this.showMessage('NIC cannot exceed 20 characters.', true);
      return;
    }

    if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) {
      this.showMessage(
        'Linked User ID must be a positive integer or left blank.',
        true,
      );
      return;
    }

    if (hireDate && hireDate > this.today) {
      this.showMessage('Hire date cannot be in the future.', true);
      return;
    }

    if (statusId === null || statusId === undefined) {
      this.showMessage('Please select a staff status.', true);
      return;
    }

    if (
      staffCode &&
      this.staffList.some(
        (item: any) =>
          String(item.id) !== String(this.staffObj.id ?? '') &&
          String(item.staffCode || '').toLowerCase() ===
            staffCode.toLowerCase(),
      )
    ) {
      this.showMessage(
        'This staff code already exists. Please use another code.',
        true,
      );
      return;
    }

    const payload: StaffRepresentation = {
      id: this.staffObj.id,
      staffCode,
      userId,
      fullName,
      role,
      phone,
      nic,
      hireDate: hireDate || '',
      classroom: classroomId || null,
      status: statusId,
    };

    this.saving = true;

    const isAdding = this.mode === 'add';

    const request = isAdding
      ? this.staffService.createStaff(payload)
      : this.staffService.updateStaff(this.staffObj.id!, payload);

    request.subscribe({
      next: () => {
        this.saving = false;

        this.showMessage(
          isAdding
            ? 'Staff registered successfully.'
            : 'Staff details updated successfully.',
        );

        this.staffObj = this.emptyStaff();
        this.mode = 'add';

        this.refreshStaff();
      },
      error: (error: any) => {
        this.saving = false;

        console.error('Staff save failed:', error);

        this.showMessage(
          error?.error?.message ||
            'Could not save staff. Check the API response and selected foreign keys.',
          true,
        );
      },
    });
  }

  get activeStaffCount(): number {
    return this.staffList.filter((staff: any) => {
      const status = this.statusName(
        staff.status ?? staff.statusId ?? staff.status_id,
      );

      return status.trim().toLowerCase() === 'active';
    }).length;
  }

  get assignedClassroomCount(): number {
    return this.staffList.filter((staff: any) => {
      const classroomId =
        staff.classroom ?? staff.classroomId ?? staff.classroom_id;

      return this.relationId(classroomId) != null;
    }).length;
  }

  get filteredStaff(): StaffRepresentation[] {
    const term = this.staffSearch.trim().toLowerCase();

    if (!term) {
      return this.staffList;
    }

    return this.staffList.filter((staff: any) => {
      const searchText = [
        staff.staffCode,
        staff.fullName,
        staff.role,
        staff.phone,
        staff.nic,
        this.classroomName(staff.classroom ?? staff.classroomId),
        this.statusName(staff.status ?? staff.statusId),
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(term);
    });
  }

  classroomLabel(classroom: any): string {
    const roomName =
      classroom?.classroomName ||
      classroom?.roomName ||
      classroom?.name ||
      classroom?.classroomCode ||
      classroom?.roomCode;

    if (roomName) {
      const code = classroom?.classroomCode || classroom?.roomCode;

      return code && !String(roomName).includes(String(code))
        ? `${roomName} · ${code}`
        : String(roomName);
    }

    return classroom?.id != null ? `Classroom #${classroom.id}` : 'Classroom';
  }

  classroomName(value: any): string {
    const id = this.relationId(value);

    if (value && typeof value === 'object') {
      return this.classroomLabel(value);
    }

    const classroom = this.classrooms.find(
      (item: any) => String(item.id) === String(id),
    );

    return classroom ? this.classroomLabel(classroom) : '';
  }

  statusName(value: any): string {
    if (value && typeof value === 'object') {
      return value.name || '';
    }

    return (
      this.statuses.find((item: any) => String(item.id) === String(value))
        ?.name || (value == null ? '' : String(value))
    );
  }

  statusClass(value: any): string {
    return `status-${String(value || 'unknown')
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
  }

  private relationId(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return typeof value === 'object' ? (value.id ?? null) : value;
  }

  private generateStaffCode(): string {
    return `STF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  }

  private localDate(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  private scrollToForm(): void {
    setTimeout(() => {
      document.getElementById('staffFormCard')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  staffInitials(value: any): string {
    const name = String(value || '').trim();

    if (!name) {
      return 'ST';
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('');
  }

  get staffProfileVisible(): boolean {
    return this.mode !== 'add' && !!String(this.staffObj.fullName || '').trim();
  }

  private showMessage(message: string, isError = false): void {
    this.message = message;
    this.messageIsError = isError;
  }

  resetStaffForm(): void {
    this.newStaff();
  }
}
