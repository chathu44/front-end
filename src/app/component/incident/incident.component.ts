import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';

import { StatusService } from '../services/api/status/status.service';
import { IncidentRepresentation } from '../services/api/module/incident-representation';
import { IncidentService } from '../services/api/incident/incident.service';
import { PermissionHelperService } from '../services/permission-helper.service';

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
  allClassroomList: any[] = [];
  allReportedByList: any[] = [];
  allStatus: any[] = [];

  selectedChildId = '';
  selectedClassroomId = '';
  selectedReportedById = '';
  selectedStatusId = '';

  searchText = '';

  isEditIncident = false;
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

  /*
   * These IDs must match system_authentications and the IDs
   * returned by your existing get-auth-ids API.
   *
   * The current console output showed 100 and 101, but did
   * not show 102 and 103. Update/delete therefore remain
   * disabled until those permissions are actually returned.
   */
  private readonly permissionIds = {
    view: 100,
    create: 101,
    update: 102,
    delete: 103,
  } as const;

  constructor(
    private incidentService: IncidentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(
      this.permissionIds.view
    );

    this.canCreate = this.permissionHelper.has(
      this.permissionIds.create
    );

    this.canUpdate = this.permissionHelper.has(
      this.permissionIds.update
    );

    this.canDelete = this.permissionHelper.has(
      this.permissionIds.delete
    );

    // Do not load protected incident details for users
    // who do not have view permission.
    if (!this.canView) {
      return;
    }

    this.GetAllChildList();
    this.GetAllClassroomList();
    this.GetAllReportedByList();
    this.GetAllStatus();
    this.GetAllIncidents();
  }

  // Selected child's existing health profile.
  get selectedChild(): any | null {
    return (
      this.allChildList.find(
        (child: any) =>
          String(child.id) === String(this.selectedChildId)
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
        String(value ?? '').toLowerCase().includes(search)
      );
    });
  }

  get openIncidentCount(): number {
    return this.incidents.filter((incident: any) => {
      const status = this.statusName(
        incident.status
      ).toLowerCase();

      return (
        status === 'open' ||
        status === 'follow-up required'
      );
    }).length;
  }

  get parentNotificationPendingCount(): number {
    return this.incidents.filter(
      (incident: any) =>
        incident.parentNotified !== true
    ).length;
  }

  // CREATE / UPDATE
  SaveIncident(): void {
    if (this.saving) {
      return;
    }

    if (!this.isEditIncident && !this.canCreate) {
      swal(
        'Permission required',
        'You do not have permission to register incidents.',
        'warning'
      );
      return;
    }

    if (this.isEditIncident && !this.canUpdate) {
      swal(
        'Permission required',
        'You do not have permission to update incidents.',
        'warning'
      );
      return;
    }

    if (
      !this.incidentObj.incidentDate ||
      !this.incidentObj.incidentType ||
      !this.incidentObj.description?.trim() ||
      !this.selectedChildId ||
      !this.selectedClassroomId ||
      !this.selectedReportedById ||
      !this.selectedStatusId
    ) {
      swal(
        'Missing information',
        'Complete all required fields before saving.',
        'warning'
      );
      return;
    }

    const isEdit = this.isEditIncident;

    const payload: IncidentRepresentation = {
      ...this.incidentObj,

      description:
        this.incidentObj.description.trim(),

      actionTaken:
        this.incidentObj.actionTaken?.trim() ?? '',

      parentNotified:
        this.incidentObj.parentNotified === true,

      child: this.selectedChildId,
      classroom: this.selectedClassroomId,
      reportedBy: this.selectedReportedById,
      status: this.selectedStatusId,
    };

    swal({
      title: isEdit
        ? 'Update incident?'
        : 'Register incident?',

      text: isEdit
        ? 'Save the changes to this incident record?'
        : 'Register this incident record?',

      icon: 'warning',

      buttons: [
        'Cancel',
        isEdit ? 'Update' : 'Save',
      ],

      dangerMode: false,
    } as any).then((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.saving = true;

      this.incidentService
        .SaveIncident(payload, isEdit)
        .subscribe({
          next: () => {
            this.saving = false;

            this.ResetForm();
            this.GetAllIncidents();

            swal(
              'Saved',
              isEdit
                ? 'Incident updated successfully.'
                : 'Incident registered successfully.',
              'success'
            );
          },

          error: (error: any) => {
            this.saving = false;

            swal(
              'Save failed',
              this.errorMessage(error),
              'error'
            );
          },
        });
    });
  }

  // READ ALL
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

        swal(
          'Unable to load incidents',
          this.errorMessage(error),
          'error'
        );
      },
    });
  }

  // READ ONE / PREPARE UPDATE
  GetIncidentById(id: string | number): void {
    if (!this.canUpdate) {
      swal(
        'Permission required',
        'You do not have permission to update incidents.',
        'warning'
      );
      return;
    }

    if (id == null) {
      return;
    }

    this.incidentService
      .GetIncidentById(id)
      .subscribe({
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
              'warning'
            );
            return;
          }

          this.incidentObj = {
            id: record.id,
            incidentCode: record.incidentCode ?? '',

            incidentDate: String(
              record.incidentDate ?? ''
            ).slice(0, 16),

            incidentType:
              record.incidentType ?? 'Other',

            description:
              record.description ?? '',

            actionTaken:
              record.actionTaken ?? '',

            parentNotified:
              record.parentNotified === true,

            child:
              record.child?.id ??
              record.child ??
              null,

            classroom:
              record.classroom?.id ??
              record.classroom ??
              null,

            reportedBy:
              record.reportedBy?.id ??
              record.reportedBy ??
              null,

            status:
              record.status?.id ??
              record.status ??
              null,
          };

          this.selectedChildId =
            this.toSelectValue(this.incidentObj.child);

          this.selectedClassroomId =
            this.toSelectValue(this.incidentObj.classroom);

          this.selectedReportedById =
            this.toSelectValue(this.incidentObj.reportedBy);

          this.selectedStatusId =
            this.toSelectValue(this.incidentObj.status);

          this.isEditIncident = true;

          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        },

        error: (error: any) => {
          swal(
            'Unable to open incident',
            this.errorMessage(error),
            'error'
          );
        },
      });
  }

  // DELETE
  DeleteById(id: string | number): void {
    if (!this.canDelete) {
      swal(
        'Permission required',
        'You do not have permission to delete incidents.',
        'warning'
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

      this.incidentService
        .DeleteIncidentById(id)
        .subscribe({
          next: () => {
            if (
              String(this.incidentObj.id) === String(id)
            ) {
              this.ResetForm();
            }

            this.GetAllIncidents();

            swal(
              'Deleted',
              'Incident deleted successfully.',
              'success'
            );
          },

          error: (error: any) => {
            swal(
              'Delete failed',
              this.errorMessage(error),
              'error'
            );
          },
        });
    });
  }

  // CHILD DROPDOWN
  GetAllChildList(): void {
    this.incidentService.GetAllChildList().subscribe({
      next: (response: any) => {
        this.allChildList = this.extractList(response);
      },

      error: () => {
        this.allChildList = [];
      },
    });
  }

  // CLASSROOM DROPDOWN
  GetAllClassroomList(): void {
    this.incidentService.GetAllClassroomList().subscribe({
      next: (response: any) => {
        this.allClassroomList = this.extractList(response);
      },

      error: () => {
        this.allClassroomList = [];
      },
    });
  }

  // STAFF DROPDOWN
  GetAllReportedByList(): void {
    this.incidentService.GetAllReportedByList().subscribe({
      next: (response: any) => {
        this.allReportedByList = this.extractList(response);
      },

      error: () => {
        this.allReportedByList = [];
      },
    });
  }

  // STATUS DROPDOWN
  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe({
      next: (response: any) => {
        this.allStatus = this.extractList(response);
      },

      error: () => {
        this.allStatus = [];
      },
    });
  }

  // RESET / CANCEL
  ResetForm(): void {
    this.incidentObj = this.newIncident();

    this.selectedChildId = '';
    this.selectedClassroomId = '';
    this.selectedReportedById = '';
    this.selectedStatusId = '';

    this.isEditIncident = false;
  }

  // LABEL HELPERS
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

    const name = [
      child.firstName,
      child.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      name ||
      child.childCode ||
      `Child ${child.id ?? ''}`
    );
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
      [
        staff.firstName,
        staff.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return (
      fullName ||
      staff.staffCode ||
      `Staff ${staff.id ?? ''}`
    );
  }

  // DEFAULT FORM VALUES
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

    const localDate = new Date(
      now.getTime() -
      now.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 16);
  }

  private toSelectValue(value: any): string {
    if (value == null || value === '') {
      return '';
    }

    return String(
      typeof value === 'object'
        ? value.id ?? ''
        : value
    );
  }

  // ACCEPT COMMON API RESPONSE SHAPES
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

    if (
      response &&
      typeof response === 'object' &&
      response.id != null
    ) {
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

  // DISPLAY API ERROR DETAILS
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