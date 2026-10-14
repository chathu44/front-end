import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';

import { AttendanceRepresentation } from '../services/api/module/attendance-representation';
import { AttendanceService } from '../services/api/attendance/attendance.service';
import { StatusService } from '../services/api/status/status.service';

interface AttendanceRosterRow {
  enrollment: any;
  child: any;
  attendance: AttendanceRepresentation | null;
}

@Component({
  selector: 'app-attendance',
  standalone: false,
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  attendances: AttendanceRepresentation[] = [];
  enrollments: any[] = [];
  classrooms: any[] = [];
  allStaff: any[] = [];
  allStatus: any[] = [];

  selectedClassroomId: string | number | null = null;
  selectedDate = '';
  searchTerm = '';

  checkoutChildId: string | number | null = null;
  pickupPersonDraft = '';
  checkoutNotesDraft = '';
  pickupVerified = false;

  notesChildId: string | number | null = null;
  notesDraft = '';

  editingChildId: string | number | null = null;
  editAttendanceDraft: AttendanceRepresentation = {};

  todayLabel = '';
  actionMessage = '';
  actionMessageIsError = false;
  loading = true;
  private classroomsLoading = true;
  private enrollmentsLoading = true;
  private attendanceLoading = true;
  staffLoading = true;

  canCreate = true;
  canUpdate = true;
  canDelete = true;

  private currentUserClaims: any = null;
  currentStaffProfile: any = null;

  constructor(
    private attendanceService: AttendanceService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    this.selectedDate = this.localDate(new Date());
    this.todayLabel = this.formatDate(this.selectedDate);
    this.currentUserClaims = this.readCurrentUserClaims();

    this.GetAllClassroomList();
    this.GetAllEnrollmentList();
    this.GetAllAttendances();
    this.GetAllStaffList();
    this.GetAllStatus();
  }

  get isTodaySelected(): boolean {
    return this.selectedDate === this.localDate(new Date());
  }

  get availableClassrooms(): any[] {
    return this.classrooms.filter((room: any) => {
      const statusName = this.statusName(room.status).toLowerCase();
      return !statusName || statusName !== 'inactive';
    });
  }

  get classroomChildren(): AttendanceRosterRow[] {
    if (this.selectedClassroomId === null || this.selectedClassroomId === '') {
      return [];
    }

    const activeEnrollments = this.enrollments.filter((enrollment: any) => {
      const classroomId = this.relationId(enrollment.classroom);
      const childId = this.relationId(enrollment.child);

      return childId !== null &&
        String(classroomId) === String(this.selectedClassroomId) &&
        this.isEnrollmentCurrent(enrollment);
    });

    const uniqueRows = new Map<string, AttendanceRosterRow>();

    for (const enrollment of activeEnrollments) {
      const child = enrollment.child && typeof enrollment.child === 'object'
        ? enrollment.child
        : null;

      if (!child || child.id === null || child.id === undefined) {
        continue;
      }

      const key = String(child.id);
      if (!uniqueRows.has(key)) {
        uniqueRows.set(key, {
          enrollment,
          child,
          attendance: this.findAttendanceForChild(child.id)
        });
      }
    }

    return Array.from(uniqueRows.values()).sort((a, b) =>
      this.childName(a.child).localeCompare(this.childName(b.child))
    );
  }

  get filteredRoster(): AttendanceRosterRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.classroomChildren;
    }

    return this.classroomChildren.filter((row: AttendanceRosterRow) => {
      const text = [
        this.childName(row.child),
        row.child?.childCode,
        row.child?.id,
        row.child?.parent?.fullName,
        row.attendance?.pickupPerson,
        row.attendance?.notes,
        this.attendanceStateLabel(row)
      ].filter((value: any) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      return text.includes(term);
    });
  }

  get totalChildren(): number {
    return this.classroomChildren.length;
  }

  get childrenInCare(): number {
    return this.classroomChildren.filter((row: AttendanceRosterRow) =>
      !!row.attendance?.checkInTime && !row.attendance?.checkOutTime
    ).length;
  }

  get childrenPickedUp(): number {
    return this.classroomChildren.filter((row: AttendanceRosterRow) =>
      !!row.attendance?.checkOutTime
    ).length;
  }

  get childrenNotArrived(): number {
    return this.classroomChildren.filter((row: AttendanceRosterRow) => {
      const state = this.attendanceStateLabel(row);
      return state === 'Not arrived' || state === 'Absent';
    }).length;
  }

  get currentStaffMessage(): string {
    if (this.staffLoading) {
      return 'Finding the staff profile linked to your login...';
    }
    if (!this.currentStaffProfile) {
      return 'Your login could not be matched to a Staff profile. Link your app user to a staff profile before recording arrival or pickup, so attendance is attributed correctly.';
    }
    return 'Attendance actions will be recorded under ' +
      (this.currentStaffProfile.fullName || this.currentStaffProfile.staffCode || 'your staff profile') + '.';
  }

  GetAllClassroomList(): void {
    this.classroomsLoading = true;
    this.updateRosterLoading();
    this.attendanceService.GetAllClassroomList().subscribe({
      next: (response: any) => {
        this.classrooms = response?.data?.dataList || [];
        this.classroomsLoading = false;
        this.updateRosterLoading();
        this.trySelectStaffClassroom();
      },
      error: () => {
        this.classrooms = [];
        this.classroomsLoading = false;
        this.updateRosterLoading();
        this.showMessage('Could not load classrooms. Please refresh and try again.', true);
      }
    });
  }

  GetAllEnrollmentList(): void {
    this.enrollmentsLoading = true;
    this.updateRosterLoading();
    this.attendanceService.GetAllEnrollmentList().subscribe({
      next: (response: any) => {
        this.enrollments = response?.data?.dataList || [];
        this.enrollmentsLoading = false;
        this.updateRosterLoading();
      },
      error: () => {
        this.enrollments = [];
        this.enrollmentsLoading = false;
        this.updateRosterLoading();
        this.showMessage('Could not load current enrollments. The classroom roster is unavailable.', true);
      }
    });
  }

  GetAllAttendances(): void {
    this.attendanceLoading = true;
    this.updateRosterLoading();
    this.attendanceService.GetAllAttendances().subscribe({
      next: (response: any) => {
        this.attendances = response?.data?.dataList || [];
        this.attendanceLoading = false;
        this.updateRosterLoading();
      },
      error: () => {
        this.attendances = [];
        this.attendanceLoading = false;
        this.updateRosterLoading();
        this.showMessage('Could not load attendance records. Please refresh and try again.', true);
      }
    });
  }

  GetAllStaffList(): void {
    this.staffLoading = true;
    this.attendanceService.GetAllStaffList().subscribe({
      next: (response: any) => {
        this.allStaff = response?.data?.dataList || [];
        this.currentStaffProfile = this.findCurrentStaffProfile();
        this.staffLoading = false;
        this.trySelectStaffClassroom();
      },
      error: () => {
        this.allStaff = [];
        this.currentStaffProfile = null;
        this.staffLoading = false;
      }
    });
  }

  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe({
      next: (response: any) => {
        this.allStatus = response?.data?.dataList || [];
      },
      error: () => {
        this.allStatus = [];
      }
    });
  }

  onDateChange(): void {
    this.checkoutChildId = null;
    this.notesChildId = null;
    this.editingChildId = null;
    this.editAttendanceDraft = {};
    this.actionMessage = '';
  }

  CheckIn(row: AttendanceRosterRow): void {
    if (!this.ensureTodayAction()) {
      return;
    }
    if (!this.ensureCurrentStaff()) {
      return;
    }

    const childId = row.child.id;
    const existing = this.findAttendanceForChild(childId);

    if (existing?.checkOutTime) {
      this.showMessage('This child already has a check-out record for the selected date.', true);
      this.GetAllAttendances();
      return;
    }

    if (existing?.checkInTime) {
      this.showMessage('This child is already checked in.', true);
      return;
    }

    const presentStatusId = this.findStatusId('Present') ?? this.findStatusId('Active');
    if (presentStatusId === null) {
      this.showMessage('Please add a Present status in Status Management before recording attendance.', true);
      return;
    }

    const payload: AttendanceRepresentation = {
      ...(existing || {}),
      id: existing?.id,
      attendanceDate: this.selectedDate,
      checkInTime: this.localDateTime(new Date()),
      checkOutTime: null,
      checkedInBy: this.currentStaffProfile.id,
      checkedOutBy: null,
      pickupPerson: existing?.pickupPerson || '',
      notes: existing?.notes || '',
      child: childId,
      classroom: this.selectedClassroomId,
      status: presentStatusId
    };

    const type = existing?.id === undefined || existing?.id === null ? 'Add' : 'Update';
    this.attendanceService.createAttendance(payload, type).subscribe({
      next: () => {
        this.showMessage(this.childName(row.child) + ' checked in at ' + this.formatTime(payload.checkInTime) + '.');
        this.GetAllAttendances();
      },
     error: (error: any): void => {
  console.error('CHECK-IN HTTP STATUS:', error?.status);

  console.error(
    'CHECK-IN RESPONSE:',
    JSON.stringify(error?.error, null, 2)
  );

  console.error(
    'CHECK-IN PAYLOAD:',
    JSON.stringify(payload, null, 2)
  );

  this.showMessage(
    this.getAttendanceRequestError('Check-in', error),
    true
  );
}
    });
  }

  MarkAbsent(row: AttendanceRosterRow): void {
    if (!this.ensureTodayAction() || !this.ensureCurrentStaff()) {
      return;
    }

    const existing = this.findAttendanceForChild(row.child.id);
    if (existing?.checkInTime || existing?.checkOutTime) {
      this.showMessage('This child already has arrival or departure times, so they cannot be marked absent.', true);
      return;
    }

    const absentStatusId = this.findStatusId('Absent');
    if (absentStatusId === null) {
      this.showMessage('Please add an Absent status in Status Management before marking absences.', true);
      return;
    }

    swal({
      title: 'Mark child absent?',
      text: 'This records the child as absent for ' + this.formatDate(this.selectedDate) + '. You can still check them in later if they arrive.',
      icon: 'warning',
      buttons: ['Cancel', 'Mark Absent'],
      dangerMode: true
    }).then((confirmed: any) => {
      if (!confirmed) {
        return;
      }

      const payload: AttendanceRepresentation = {
        ...(existing || {}),
        id: existing?.id,
        attendanceDate: this.selectedDate,
        checkInTime: null,
        checkOutTime: null,
        checkedInBy: null,
        checkedOutBy: null,
        pickupPerson: existing?.pickupPerson || '',
        notes: existing?.notes || '',
        child: row.child.id,
        classroom: this.selectedClassroomId,
        status: absentStatusId
      };

      const type = existing?.id === undefined || existing?.id === null ? 'Add' : 'Update';
      this.attendanceService.createAttendance(payload, type).subscribe({
        next: () => {
          this.showMessage(this.childName(row.child) + ' marked absent.');
          this.GetAllAttendances();
        },
       error: (error: any): void => {
  console.error('MARK ABSENT HTTP STATUS:', error?.status);

  console.error(
    'MARK ABSENT RESPONSE:',
    JSON.stringify(error?.error, null, 2)
  );

  console.error(
    'MARK ABSENT PAYLOAD:',
    JSON.stringify(payload, null, 2)
  );

  this.showMessage(
    this.getAttendanceRequestError('Mark absent', error),
    true
  );
}
      });
    });
  }

  OpenCheckOut(row: AttendanceRosterRow): void {
    if (!this.ensureTodayAction() || !this.ensureCurrentStaff()) {
      return;
    }
    if (!row.attendance?.id || !row.attendance.checkInTime || row.attendance.checkOutTime) {
      this.showMessage('Only a child currently checked in can be checked out.', true);
      return;
    }

    this.checkoutChildId = row.child.id;
    this.pickupPersonDraft = this.defaultPickupPerson(row);
    this.checkoutNotesDraft = row.attendance.notes || '';
    this.pickupVerified = false;
    this.notesChildId = null;
    this.editingChildId = null;
    this.actionMessage = '';
  }

  CancelCheckOut(): void {
    this.checkoutChildId = null;
    this.pickupPersonDraft = '';
    this.checkoutNotesDraft = '';
    this.pickupVerified = false;
  }

  ConfirmCheckOut(row: AttendanceRosterRow): void {
    if (!this.ensureTodayAction() || !this.ensureCurrentStaff()) {
      return;
    }

    const existing = this.findAttendanceForChild(row.child.id);
    if (!existing?.id || !existing.checkInTime || existing.checkOutTime) {
      this.showMessage('This attendance record is no longer available for check-out. Refresh the page.', true);
      this.CancelCheckOut();
      return;
    }

    const pickupPerson = this.pickupPersonDraft.trim();
    if (!pickupPerson) {
      this.showMessage('Enter the name of the person collecting the child.', true);
      return;
    }
    if (!this.pickupVerified) {
      this.showMessage('Confirm that the pickup person’s identity and authorization have been checked.', true);
      return;
    }

    const leftStatusId = this.findStatusId('Left');
    const payload: AttendanceRepresentation = {
      ...existing,
      attendanceDate: this.selectedDate,
      checkInTime: existing.checkInTime,
      checkOutTime: this.localDateTime(new Date()),
      checkedInBy: this.relationId(existing.checkedInBy),
      checkedOutBy: this.currentStaffProfile.id,
      pickupPerson,
      notes: this.checkoutNotesDraft.trim(),
      child: row.child.id,
      classroom: this.selectedClassroomId,
      status: leftStatusId ?? this.relationId(existing.status)
    };

    this.attendanceService.createAttendance(payload, 'Update').subscribe({
      next: () => {
        this.showMessage(this.childName(row.child) + ' checked out. Pickup recorded: ' + pickupPerson + '.');
        this.CancelCheckOut();
        this.GetAllAttendances();
      },
      error: () => this.showMessage('Check-out failed. Please verify the record and try again.', true)
    });
  }

  OpenNotes(row: AttendanceRosterRow): void {
    if (!row.attendance?.id) {
      this.showMessage('Notes can be saved after an attendance record exists.', true);
      return;
    }
    this.notesChildId = row.child.id;
    this.notesDraft = row.attendance.notes || '';
    this.checkoutChildId = null;
    this.editingChildId = null;
    this.actionMessage = '';
  }

  CancelNotes(): void {
    this.notesChildId = null;
    this.notesDraft = '';
  }

  SaveNotes(row: AttendanceRosterRow): void {
    const existing = this.findAttendanceForChild(row.child.id);
    if (!existing?.id) {
      this.showMessage('Attendance record not found. Refresh and try again.', true);
      this.CancelNotes();
      return;
    }

    const payload: AttendanceRepresentation = {
      ...existing,
      attendanceDate: this.dateOnly(existing.attendanceDate) || this.selectedDate,
      child: this.relationId(existing.child),
      classroom: this.relationId(existing.classroom),
      checkedInBy: this.relationId(existing.checkedInBy),
      checkedOutBy: this.relationId(existing.checkedOutBy),
      status: this.relationId(existing.status),
      notes: this.notesDraft.trim()
    };

    this.attendanceService.createAttendance(payload, 'Update').subscribe({
      next: () => {
        this.showMessage('Notes saved for ' + this.childName(row.child) + '.');
        this.CancelNotes();
        this.GetAllAttendances();
      },
      error: () => this.showMessage('Could not save notes. Please try again.', true)
    });
  }

  isCheckoutRow(row: AttendanceRosterRow): boolean {
    return this.checkoutChildId !== null && String(this.checkoutChildId) === String(row.child?.id);
  }

  isNotesRow(row: AttendanceRosterRow): boolean {
    return this.notesChildId !== null && String(this.notesChildId) === String(row.child?.id);
  }

  isEditingRow(row: AttendanceRosterRow): boolean {
    return this.editingChildId !== null && String(this.editingChildId) === String(row.child?.id);
  }

  OpenEditRecord(row: AttendanceRosterRow): void {
    const record = this.findAttendanceForChild(row.child.id);
    if (!record?.id) {
      this.showMessage('Attendance record not found. Refresh and try again.', true);
      return;
    }

    this.editingChildId = row.child.id;
    this.checkoutChildId = null;
    this.notesChildId = null;
    this.editAttendanceDraft = {
      ...record,
      attendanceDate: this.dateOnly(record.attendanceDate),
      checkInTime: this.toDateTimeLocal(record.checkInTime),
      checkOutTime: this.toDateTimeLocal(record.checkOutTime),
      checkedInBy: this.relationId(record.checkedInBy),
      checkedOutBy: this.relationId(record.checkedOutBy),
      child: this.relationId(record.child),
      classroom: this.relationId(record.classroom),
      status: this.relationId(record.status)
    };
    this.actionMessage = '';
  }

  CancelEditRecord(): void {
    this.editingChildId = null;
    this.editAttendanceDraft = {};
  }

  SaveEditedRecord(row: AttendanceRosterRow): void {
    const existing = this.findAttendanceForChild(row.child.id);
    if (!existing?.id) {
      this.showMessage('Attendance record not found. Refresh and try again.', true);
      this.CancelEditRecord();
      return;
    }

    if (!this.editAttendanceDraft.attendanceDate) {
      this.showMessage('Attendance date is required.', true);
      return;
    }
    if (this.editAttendanceDraft.checkOutTime && !this.editAttendanceDraft.checkInTime) {
      this.showMessage('A check-out time requires a check-in time.', true);
      return;
    }
    if (this.editAttendanceDraft.checkInTime && this.editAttendanceDraft.checkOutTime &&
        new Date(this.editAttendanceDraft.checkOutTime).getTime() < new Date(this.editAttendanceDraft.checkInTime).getTime()) {
      this.showMessage('Check-out time cannot be earlier than check-in time.', true);
      return;
    }
    if (this.editAttendanceDraft.checkOutTime && !String(this.editAttendanceDraft.pickupPerson || '').trim()) {
      this.showMessage('Enter the pickup person for a completed check-out.', true);
      return;
    }

    const payload: AttendanceRepresentation = {
      ...existing,
      id: existing.id,
      attendanceDate: this.editAttendanceDraft.attendanceDate,
      checkInTime: this.editAttendanceDraft.checkInTime || null,
      checkOutTime: this.editAttendanceDraft.checkOutTime || null,
      checkedInBy: this.relationId(existing.checkedInBy),
      checkedOutBy: this.relationId(existing.checkedOutBy),
      pickupPerson: String(this.editAttendanceDraft.pickupPerson || '').trim(),
      notes: String(this.editAttendanceDraft.notes || '').trim(),
      child: this.relationId(existing.child),
      classroom: this.relationId(existing.classroom),
      status: this.relationId(this.editAttendanceDraft.status) ?? this.relationId(existing.status)
    };

    this.attendanceService.createAttendance(payload, 'Update').subscribe({
      next: () => {
        this.showMessage('Attendance record corrected for ' + this.childName(row.child) + '.');
        this.CancelEditRecord();
        this.GetAllAttendances();
      },
      error: () => this.showMessage('Could not update the attendance record. Please try again.', true)
    });
  }

  DeleteAttendanceRecord(row: AttendanceRosterRow): void {
    const record = this.findAttendanceForChild(row.child.id);
    if (!record?.id) { return; }

    swal({
      title: 'Delete attendance record?',
      text: 'This removes the attendance record for ' + this.childName(row.child) + ' on ' + this.formatDate(record.attendanceDate) + '.',
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true
    }).then((confirmed: any) => {
      if (!confirmed) { return; }
      this.attendanceService.DeleteAttendanceById(record.id).subscribe({
        next: () => {
          this.showMessage('Attendance record deleted for ' + this.childName(row.child) + '.');
          this.CancelEditRecord();
          this.GetAllAttendances();
        },
        error: () => this.showMessage('Could not delete the attendance record.', true)
      });
    });
  }

  private toDateTimeLocal(value: any): string {
    if (!value) { return ''; }
    return String(value).replace(' ', 'T').slice(0, 16);
  }

  attendanceStateLabel(row: AttendanceRosterRow): string {
    const record = row.attendance;
    if (record?.checkOutTime) {
      return 'Picked up';
    }
    if (record?.checkInTime) {
      return 'In daycare';
    }
    if (this.statusName(record?.status).toLowerCase() === 'absent') {
      return 'Absent';
    }
    return 'Not arrived';
  }

  attendanceStateClass(row: AttendanceRosterRow): string {
    const label = this.attendanceStateLabel(row);
    if (label === 'Picked up') { return 'state-picked-up'; }
    if (label === 'In daycare') { return 'state-in-care'; }
    if (label === 'Absent') { return 'state-absent'; }
    return 'state-not-arrived';
  }

  attendanceStatusName(row: AttendanceRosterRow): string {
    return this.statusName(row.attendance?.status) || '—';
  }

  hasCheckIn(row: AttendanceRosterRow): boolean {
    return !!row.attendance?.checkInTime;
  }

  hasCheckedOut(row: AttendanceRosterRow): boolean {
    return !!row.attendance?.checkOutTime;
  }

  isAbsent(row: AttendanceRosterRow): boolean {
    return this.attendanceStateLabel(row) === 'Absent';
  }

  childName(child: any): string {
    if (!child) { return 'Unknown child'; }
    const name = [child.firstName, child.lastName].filter(Boolean).join(' ').trim();
    return name || child.fullName || child.childCode || ('Child #' + child.id);
  }

  childCode(child: any): string {
    return child?.childCode || ('CH-' + child?.id);
  }

  parentName(row: AttendanceRosterRow): string {
    const childParent = row.child?.parent;
    const enrollmentParent = row.enrollment?.parent;
    const parent = childParent && typeof childParent === 'object'
      ? childParent
      : enrollmentParent;
    if (!parent || typeof parent !== 'object') { return '—'; }
    return parent.fullName || [parent.firstName, parent.lastName].filter(Boolean).join(' ') || '—';
  }

  childInitials(child: any): string {
    const name = this.childName(child).split(' ').filter(Boolean);
    return name.slice(0, 2).map((part: string) => part.charAt(0).toUpperCase()).join('') || 'CH';
  }

  staffName(value: any): string {
    if (!value) { return '—'; }
    if (typeof value === 'object') {
      return value.fullName || value.name || value.staffCode || '—';
    }
    const staff = this.allStaff.find((item: any) => String(item.id) === String(value));
    return staff?.fullName || staff?.staffCode || '—';
  }

  formatDate(value: any): string {
    const dateText = this.dateOnly(value);
    if (!dateText) { return '—'; }
    const parsed = new Date(dateText + 'T00:00:00');
    return Number.isNaN(parsed.getTime()) ? dateText : parsed.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatTime(value: any): string {
    if (!value) { return '—'; }
    const textValue = String(value);
    const timePart = textValue.includes('T') ? textValue.split('T')[1] : textValue;
    const hourMinute = timePart.slice(0, 5);
    const parts = hourMinute.split(':');
    if (parts.length !== 2) { return hourMinute || '—'; }
    const hour = Number(parts[0]);
    if (Number.isNaN(hour)) { return hourMinute; }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return displayHour + ':' + parts[1] + ' ' + period;
  }

  trackByChildId(index: number, row: AttendanceRosterRow): any {
    return row.child?.id ?? index;
  }

  refreshAll(): void {
    this.actionMessage = '';
    this.checkoutChildId = null;
    this.notesChildId = null;
    this.editingChildId = null;
    this.GetAllClassroomList();
    this.GetAllEnrollmentList();
    this.GetAllAttendances();
    this.GetAllStaffList();
    this.GetAllStatus();
  }

  private updateRosterLoading(): void {
    this.loading = this.classroomsLoading || this.enrollmentsLoading || this.attendanceLoading;
  }

  private findAttendanceForChild(childId: any): AttendanceRepresentation | null {
    const date = this.selectedDate || this.localDate(new Date());
    const matchingRecords = this.attendances.filter((record: any) =>
      String(this.relationId(record.child)) === String(childId) &&
      this.dateOnly(record.attendanceDate) === date
    );

    const inSelectedRoom = matchingRecords.find((record: any) =>
      String(this.relationId(record.classroom)) === String(this.selectedClassroomId)
    );
    return inSelectedRoom || matchingRecords[0] || null;
  }

  private isEnrollmentCurrent(enrollment: any): boolean {
    const status = this.statusName(enrollment.status).trim().toLowerCase();
    if (status && !['active', 'approved', 'enrolled', 'current'].includes(status)) {
      return false;
    }

    const date = this.selectedDate;
    const startDate = this.dateOnly(enrollment.startDate);
    const endDate = this.dateOnly(enrollment.endDate);
    if (startDate && startDate > date) { return false; }
    if (endDate && endDate < date) { return false; }
    return true;
  }

  private statusName(value: any): string {
    if (value && typeof value === 'object') {
      return value.name || '';
    }
    const found = this.allStatus.find((item: any) => String(item.id) === String(value));
    return found?.name || '';
  }

  private findStatusId(name: string): any | null {
    const found = this.allStatus.find((item: any) =>
      String(item.name || '').trim().toLowerCase() === name.toLowerCase()
    );
    return found?.id ?? null;
  }

  private relationId(value: any): any {
    if (value === null || value === undefined || value === '') { return null; }
    return typeof value === 'object' ? (value.id ?? null) : value;
  }

  private dateOnly(value: any): string {
    return value ? String(value).slice(0, 10) : '';
  }

  private localDate(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private localDateTime(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19);
  }

  private ensureTodayAction(): boolean {
    if (!this.isTodaySelected) {
      this.showMessage('Check-in and check-out actions are available only for today. Select today to record a live attendance event.', true);
      return false;
    }
    return true;
  }

  private ensureCurrentStaff(): boolean {
    if (this.currentStaffProfile?.id !== undefined && this.currentStaffProfile?.id !== null) {
      return true;
    }
    this.showMessage('Your logged-in account is not linked to a Staff profile. Please link the User and Staff records before recording attendance.', true);
    return false;
  }

  private defaultPickupPerson(row: AttendanceRosterRow): string {
    const child = row.child;
    const enrollmentParent = row.enrollment?.parent;
    const parent = child?.parent && typeof child.parent === 'object'
      ? child.parent
      : enrollmentParent;

    if (!parent || typeof parent !== 'object') { return ''; }
    return parent.fullName || [parent.firstName, parent.lastName].filter(Boolean).join(' ') || '';
  }

  private trySelectStaffClassroom(): void {
    if (this.selectedClassroomId !== null && this.selectedClassroomId !== '') { return; }
    const classroomId = this.relationId(this.currentStaffProfile?.classroom);
    if (classroomId !== null && this.availableClassrooms.some((room: any) => String(room.id) === String(classroomId))) {
      this.selectedClassroomId = classroomId;
    }
  }

  private findCurrentStaffProfile(): any | null {
    if (!this.currentUserClaims) { return null; }

    const candidateValues = [
      this.currentUserClaims.userId,
      this.currentUserClaims.user_id,
      this.currentUserClaims.id,
      this.currentUserClaims.uid,
      this.currentUserClaims.sub,
      this.currentUserClaims.user?.id,
      this.currentUserClaims.user?.userId,
      this.currentUserClaims.user?.login,
      this.currentUserClaims.login,
      this.currentUserClaims.username
    ].filter((value: any) => value !== null && value !== undefined && String(value).trim() !== '');

    return this.allStaff.find((staff: any) => {
      const linkedUser = staff.user;
      const linkedUserId = this.relationId(linkedUser);
      const linkedLogin = typeof linkedUser === 'object'
        ? (linkedUser.login || linkedUser.username)
        : null;

      return candidateValues.some((candidate: any) =>
        String(candidate) === String(linkedUserId) ||
        (!!linkedLogin && String(candidate).toLowerCase() === String(linkedLogin).toLowerCase())
      );
    }) || null;
  }



  private readCurrentUserClaims(): any | null {
    try {
      const stores: Storage[] = [window.localStorage, window.sessionStorage];

      for (const store of stores) {
        for (let index = 0; index < store.length; index++) {
          const key = store.key(index) || '';

          if (!/(token|jwt|auth|current.?user|user.?id|^user$|login)/i.test(key)) {
            continue;
          }

          const raw = store.getItem(key);
          if (!raw) {
            continue;
          }

          const tokenCandidates: string[] = [raw];

          try {
            const parsed = JSON.parse(raw);

            if (parsed && typeof parsed === 'object') {
              if (
                parsed.id !== undefined ||
                parsed.userId !== undefined ||
                parsed.user_id !== undefined ||
                parsed.sub !== undefined
              ) {
                return parsed;
              }

              ['token', 'accessToken', 'access_token', 'jwt', 'authToken', 'idToken']
                .forEach((field: string) => {
                  if (typeof parsed[field] === 'string') {
                    tokenCandidates.push(parsed[field]);
                  }
                });

              if (parsed.user && typeof parsed.user === 'object' && parsed.user.id !== undefined) {
                return { ...parsed, ...parsed.user, user: parsed.user };
              }
            } else if (/(user.?id)/i.test(key) && String(parsed).trim()) {
              return { userId: parsed };
            }
          } catch (_error) {
           
          }

          for (const candidate of tokenCandidates) {
            const token = candidate.replace(/^Bearer\s+/i, '').trim();
            const sections = token.split('.');

            if (sections.length !== 3) {
              continue;
            }

            try {
              const base64 = sections[1].replace(/-/g, '+').replace(/_/g, '/');
              const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

              const claims = JSON.parse(
                decodeURIComponent(
                  Array.prototype.map.call(atob(padded), (character: string) =>
                    '%' + ('00' + character.charCodeAt(0).toString(16)).slice(-2)
                  ).join('')
                )
              );

              if (claims && typeof claims === 'object') {
                return claims;
              }
            } catch (_error) {
            
            }
          }
        }
      }
    } catch (_error) {
    
    }

    return null;
  }

  private getAttendanceRequestError(
  action: string,
  error: any
): string {
  const status = error?.status;
  const body = error?.error;

  if (status === 0) {
    return `${action} failed. The API could not be reached. Check that Spring Boot is running at http://localhost:8010.`;
  }

  let details = '';

  if (typeof body === 'string') {
    details = body;
  } else if (body && typeof body === 'object') {
    details =
      body.message ||
      body.error ||
      body.detail ||
      body.title ||
      '';

    if (!details && body.errors) {
      details = JSON.stringify(body.errors);
    }

    if (!details && Object.keys(body).length > 0) {
      details = JSON.stringify(body);
    }
  }

  if (status === 400) {
    return `${action} failed (HTTP 400). Check the submitted fields and relationships. ${details}`;
  }

  if (status === 401 || status === 403) {
    return `${action} failed (HTTP ${status}). Your login may not have permission to perform this operation. ${details}`;
  }

  if (status === 404) {
    return `${action} failed (HTTP 404). Check the attendance API endpoint. ${details}`;
  }

  return `${action} failed (HTTP ${status ?? 'unknown'}). ${
    details || error?.message || 'No additional error details were returned.'
  }`;
}

  private showMessage(message: string, isError = false): void {
    this.actionMessage = message;
    this.actionMessageIsError = isError;
  }
}

