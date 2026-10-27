import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';

import { StatusService } from '../services/api/status/status.service';
import { IncidentRepresentation } from '../services/api/module/incident-representation';
import { IncidentService } from '../services/api/incident/incident.service';
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
  selector: 'app-incident',
  standalone: false,
  templateUrl: './incident.component.html',
  styleUrls: ['./incident.component.scss'],
})
export class IncidentComponent implements OnInit {
  incidentObj: IncidentRepresentation = this.newIncident();

  incidents: any[] = [];

  allChildList: any[] = [];
  allChildList$: Observable<any[]> = of([]);
  allClassroomList: any[] = [];
  allClassroomList$: Observable<any[]> = of([]);
  allReportedByList: any[] = [];
  allReportedByList$: Observable<any[]> = of([]);
  allStatus: any[] = [];
  incidentStatusOptions$: Observable<any[]> = of([]);

  selectedChildId = '';
  selectedClassroomId = '';
  selectedReportedById = '';
  selectedStatusId = '';

  searchText = '';

  isEditIncident = false;
  isReadOnlyIncident = false;
  loadingIncidents = false;
  saving = false;

  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  readonly incidentTypes: string[] = [
    'Injury',
    'Illness',
    'Allergic Reaction',
    'Behaviour',
    'Other',
  ];

  constructor(
    private incidentService: IncidentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.INCIDENT_VIEW);

    this.canCreate = this.permissionHelper.has(AuthIds.INCIDENT_CREATE);

    this.canUpdate = this.permissionHelper.has(AuthIds.INCIDENT_UPDATE);

    this.canDelete = this.permissionHelper.has(AuthIds.INCIDENT_DELETE);

    if (!this.canView) {
      return;
    }

    this.GetAllChildList();
    this.GetAllClassroomList();
    this.GetAllReportedByList();
    this.GetAllStatus();
    this.GetAllIncidents();
  }

  get selectedChild(): any | null {
    return (
      this.allChildList.find(
        (child: any) => String(child.id) === String(this.selectedChildId),
      ) ?? null
    );
  }

  get filteredIncidents(): any[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.incidents;
    }

    return this.incidents.filter((incident: any) => {
      const childName = this.childLabel(incident.child);

      const searchableValues = [
        incident.incidentCode,
        incident.incidentDate,
        incident.incidentType,
        incident.description,
        incident.actionTaken,
        childName,
        this.classroomLabel(incident.classroom),
        this.staffLabel(incident.reportedBy),
        this.statusName(incident.status),
      ];

      return searchableValues.some((value: any) =>
        String(value ?? '')
          .toLowerCase()
          .includes(search),
      );
    });
  }

  get openIncidentCount(): number {
    return this.incidents.filter((incident: any) => {
      const status = this.statusName(incident.status).toLowerCase();

      return status === 'open' || status === 'follow-up required';
    }).length;
  }

  get parentNotificationPendingCount(): number {
    return this.incidents.filter(
      (incident: any) => incident.parentNotified !== true,
    ).length;
  }

  SaveIncident(): void {
    if (this.isReadOnlyIncident) {
      return;
    }

    if (this.saving) {
      return;
    }

    if (!this.isEditIncident && !this.canCreate) {
      swal(
        'Permission required',
        'You do not have permission to register incidents.',
        'warning',
      );
      return;
    }

    if (this.isEditIncident && !this.canUpdate) {
      swal(
        'Permission required',
        'You do not have permission to update incidents.',
        'warning',
      );
      return;
    }

    const description = String(this.incidentObj.description ?? '').trim();
    const actionTaken = String(this.incidentObj.actionTaken ?? '').trim();

    if (
      !this.incidentObj.incidentDate ||
      !this.incidentObj.incidentType ||
      description.length < 5 ||
      !this.selectedChildId ||
      !this.selectedClassroomId ||
      !this.selectedReportedById ||
      !this.selectedStatusId
    ) {
      swal(
        'Missing information',
        'Complete all required fields before saving.',
        'warning',
      );
      return;
    }
    if (description.length > 2000 || actionTaken.length > 2000) {
      swal(
        'Validation error',
        'Incident description and action taken notes must not exceed 2,000 characters.',
        'warning',
      );
      return;
    }
    const incidentDateTime = new Date(String(this.incidentObj.incidentDate));
    if (Number.isNaN(incidentDateTime.getTime())) {
      swal(
        'Validation error',
        'Enter a valid incident date and time.',
        'warning',
      );
      return;
    }
    if (incidentDateTime.getTime() > Date.now()) {
      swal(
        'Validation error',
        'An incident date and time cannot be in the future.',
        'warning',
      );
      return;
    }

    const isEdit = this.isEditIncident;

    const payload: IncidentRepresentation = {
      ...this.incidentObj,

      description,

      actionTaken,

      parentNotified: this.incidentObj.parentNotified === true,

      child: this.selectedChildId,
      classroom: this.selectedClassroomId,
      reportedBy: this.selectedReportedById,
      status: this.selectedStatusId,
    };

    swal({
      title: isEdit ? 'Update incident?' : 'Register incident?',

      text: isEdit
        ? 'Save the changes to this incident record?'
        : 'Register this incident record?',

      icon: 'warning',

      buttons: ['Cancel', isEdit ? 'Update' : 'Save'],

      dangerMode: false,
    } as any).then((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.saving = true;

      this.incidentService.SaveIncident(payload, isEdit).subscribe({
        next: () => {
          this.saving = false;

          this.ResetForm();
          this.GetAllIncidents();

          swal(
            'Saved',
            isEdit
              ? 'Incident updated successfully.'
              : 'Incident registered successfully.',
            'success',
          );
        },

        error: (error: any) => {
          this.saving = false;

          swal('Save failed', this.errorMessage(error), 'error');
        },
      });
    });
  }

  GetAllIncidents(): void {
    if (!this.canView) {
      return;
    }

    this.loadingIncidents = true;

    this.incidentService.GetAllIncidents().subscribe({
      next: (response: any) => {
        this.incidents = this.extractList(response);
        this.loadingIncidents = false;
      },

      error: (error: any) => {
        this.incidents = [];
        this.loadingIncidents = false;

        swal('Unable to load incidents', this.errorMessage(error), 'error');
      },
    });
  }

  GetIncidentById(id: string | number, forceReadOnly = false): void {
    if (!this.canView) return;

    if (id == null) {
      return;
    }

    this.incidentService.GetIncidentById(id).subscribe({
      next: (response: any) => {
        const record =
          this.extractList(response)[0] ??
          response?.data?.data ??
          response?.data ??
          response;

        if (!record || record.id == null) {
          swal(
            'Not found',
            'The selected incident record could not be found.',
            'warning',
          );
          return;
        }

        this.incidentObj = {
          id: record.id,
          incidentCode: record.incidentCode ?? '',

          incidentDate: String(record.incidentDate ?? '').slice(0, 16),

          incidentType: record.incidentType ?? 'Other',

          description: record.description ?? '',

          actionTaken: record.actionTaken ?? '',

          parentNotified: record.parentNotified === true,

          child: record.child?.id ?? record.child ?? null,

          classroom: record.classroom?.id ?? record.classroom ?? null,

          reportedBy: record.reportedBy?.id ?? record.reportedBy ?? null,

          status: record.status?.id ?? record.status ?? null,
        };

        this.selectedChildId = this.toSelectValue(this.incidentObj.child);

        this.selectedClassroomId = this.toSelectValue(
          this.incidentObj.classroom,
        );

        this.selectedReportedById = this.toSelectValue(
          this.incidentObj.reportedBy,
        );

        this.selectedStatusId = this.toSelectValue(this.incidentObj.status);

        this.isEditIncident = true;
        this.isReadOnlyIncident = forceReadOnly || !this.canUpdate;
        scrollPageToTop();
      },

      error: (error: any) => {
        swal('Unable to open incident', this.errorMessage(error), 'error');
      },
    });
  }

  DeleteById(id: string | number): void {
    if (!this.canDelete) {
      swal(
        'Permission required',
        'You do not have permission to delete incidents.',
        'warning',
      );
      return;
    }

    if (id == null) {
      return;
    }

    swal({
      title: 'Delete incident?',
      text: 'This incident record will be permanently deleted.',
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true,
    } as any).then((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.incidentService.DeleteIncidentById(id).subscribe({
        next: () => {
          if (String(this.incidentObj.id) === String(id)) {
            this.ResetForm();
          }

          this.GetAllIncidents();

          swal('Deleted', 'Incident deleted successfully.', 'success');
        },

        error: (error: any) => {
          swal('Delete failed', this.errorMessage(error), 'error');
        },
      });
    });
  }

  GetAllChildList(): void {
    this.allChildList$ = this.incidentService.GetAllChildList().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((item: any) => ({
          ...item,
          dropdownLabel: this.childLabel(item),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allChildList$.subscribe({
      next: (items: any[]) => (this.allChildList = items),
      error: () => (this.allChildList = []),
    });
  }

  GetAllClassroomList(): void {
    this.allClassroomList$ = this.incidentService.GetAllClassroomList().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((item: any) => ({
          ...item,
          dropdownLabel: this.classroomLabel(item),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allClassroomList$.subscribe({
      next: (items: any[]) => (this.allClassroomList = items),
      error: () => (this.allClassroomList = []),
    });
  }

  GetAllReportedByList(): void {
    this.allReportedByList$ = this.incidentService.GetAllReportedByList().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((item: any) => ({
          ...item,
          dropdownLabel: this.staffLabel(item),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allReportedByList$.subscribe({
      next: (items: any[]) => (this.allReportedByList = items),
      error: () => (this.allReportedByList = []),
    });
  }

  GetAllStatus(): void {
    const statuses$ = this.statusService.GetAllStatus().pipe(
      map((response: any) => unwrapApiList(response)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.incidentStatusOptions$ = statuses$.pipe(
      map((statuses: any[]) =>
        filterStatusOptions(statuses, [
          'Open',
          'Resolved',
          'Follow-up Required',
        ]),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    statuses$.subscribe({
      next: (statuses: any[]) => {
        this.allStatus = statuses;
        if (!this.isEditIncident && !this.selectedStatusId) {
          const openStatus = statuses.find(
            (status: any) =>
              normalizeLookupName(status?.name ?? status?.statusName) ===
              'open',
          );
          if (openStatus) {
            this.selectedStatusId = openStatus.id;
            this.incidentObj.status = openStatus.id;
          }
        }
      },
      error: () => (this.allStatus = []),
    });
  }

  ResetForm(): void {
    this.incidentObj = this.newIncident();

    this.selectedChildId = '';
    this.selectedClassroomId = '';
    this.selectedReportedById = '';
    const openStatus = this.allStatus.find(
      (status: any) =>
        normalizeLookupName(status?.name ?? status?.statusName) === 'open',
    );
    this.selectedStatusId = openStatus?.id ?? '';
    this.incidentObj.status = openStatus?.id ?? null;

    this.isEditIncident = false;
    this.isReadOnlyIncident = false;
  }

  statusName(status: any): string {
    if (status && typeof status === 'object') {
      return String(status.name ?? '');
    }

    return String(status ?? '');
  }

  childLabel(child: any): string {
    if (child == null) {
      return 'Unknown child';
    }

    if (typeof child !== 'object') {
      return `Child ${child}`;
    }

    const name = [child.firstName, child.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || child.childCode || `Child ${child.id ?? ''}`;
  }

  classroomLabel(classroom: any): string {
    if (classroom == null) {
      return 'Unknown classroom';
    }

    if (typeof classroom !== 'object') {
      return `Classroom ${classroom}`;
    }

    return (
      classroom.roomName ||
      classroom.classroomName ||
      classroom.classroomCode ||
      `Classroom ${classroom.id ?? ''}`
    );
  }

  staffLabel(staff: any): string {
    if (staff == null) {
      return 'Unknown staff member';
    }

    if (typeof staff !== 'object') {
      return `Staff ${staff}`;
    }

    const fullName =
      staff.fullName ||
      [staff.firstName, staff.lastName].filter(Boolean).join(' ').trim();

    return fullName || staff.staffCode || `Staff ${staff.id ?? ''}`;
  }

  private newIncident(): IncidentRepresentation {
    return {
      incidentDate: this.localDateTimeValue(),
      incidentType: 'Injury',
      description: '',
      actionTaken: '',
      parentNotified: false,

      child: null,
      classroom: null,
      reportedBy: null,
      status: null,
    };
  }

  private localDateTimeValue(): string {
    const now = new Date();

    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return localDate.toISOString().slice(0, 16);
  }

  private toSelectValue(value: any): any {
    if (value == null || value === '') return '';
    return typeof value === 'object' ? (value.id ?? '') : value;
  }

  private extractList(response: any): any[] {
    const candidates = [
      response?.data?.dataList,
      response?.dataList,
      response?.data?.data,
      response?.data,
      response,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    if (response && typeof response === 'object' && response.id != null) {
      return [response];
    }

    if (
      response?.data &&
      typeof response.data === 'object' &&
      response.data.id != null
    ) {
      return [response.data];
    }

    return [];
  }

  private errorMessage(error: any): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    return (
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      `Request failed (HTTP ${error?.status ?? 'unknown'}). Check the Spring Boot console.`
    );
  }
}
