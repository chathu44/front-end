import { Component, OnInit } from '@angular/core';
import { ProgramRepresentation } from '../services/api/module/program-representation';
import { ProgramService } from '../services/api/program/program.service';
import { StatusService } from '../services/api/status/status.service';
import { FormBuilder } from '@angular/forms';
import swal from 'sweetalert';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

@Component({
  selector: 'app-program',
  standalone: false,
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.scss'],
})
export class ProgramComponent implements OnInit {
  programObj: ProgramRepresentation = {};
  programs: Array<any> = [];
  allStatus: Array<any> = [];
  statusValue: any;
  type = '';
  isEditProgram = false;
  dtDynamicVerticalScrollExample: any;
  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private programService: ProgramService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.PROGRAM_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.PROGRAM_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.PROGRAM_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.PROGRAM_DELETE);

    console.log('Program permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.GetAllStatus();
    this.GetAllPrograms();
  }

  SaveProgram(): void {
    if (this.isEditProgram ? !this.canUpdate : !this.canCreate) {
      swal(
        'Permission denied',
        this.isEditProgram
          ? 'You do not have permission to update programs.'
          : 'You do not have permission to create programs.',
        'warning',
      );
      return;
    }
    this.type = this.isEditProgram ? 'Update' : 'Add';

    const statusId = this.getStatusId(this.programObj.status);

    if (statusId === null || statusId === undefined || statusId === '') {
      swal('Missing Status', 'Please select a status.', 'warning');
      return;
    }

    const programToSave: ProgramRepresentation = {
      ...this.programObj,
      status: statusId,
    };

    const saveProgram = (): void => {
      this.programService.createProgram(programToSave, this.type).subscribe({
        next: (): void => {
          swal(
            'Successful!',
            this.type === 'Add'
              ? 'Program has been added!'
              : 'Program has been updated!',
            'success',
          );
          this.GetAllPrograms();
          this.ClearForm();
        },
        error: (error: any): void => {
          console.error('Program save error:', error);
          swal(
            'Error!',
            error?.error?.message ||
              error?.error?.error ||
              'Unable to save program. Please check the entered details.',
            'error',
          );
        },
      });
    };

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'Do you want to add this program?',
        icon: 'warning',
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          saveProgram();
        }
      });
    } else {
      saveProgram();
    }
  }

  private getStatusId(status: any): string | number | null {
    if (status && typeof status === 'object') {
      return status.id ?? null;
    }

    return status === '' || status === undefined ? null : status;
  }

  GetProgramById(ID: any): void {
    this.programService.GetProgramById(ID).subscribe({
      next: (allData: any): void => {
        const record = allData?.data?.dataList?.[0];

        if (!record) {
          swal('Error!', 'Program record was not found.', 'error');
          return;
        }

        this.programObj = {
          ...record,
          status: record.status?.id ?? record.status ?? null,
        };

        this.statusValue = record.status?.name || 'Select Value';
        this.isEditProgram = true;

        this.selectedProgramId = record.id;
      },
      error: (error: any): void => {
        console.error('Get program error:', error);
        swal('Error!', 'Unable to load program details.', 'error');
      },
    });
  }

  GetAllPrograms(): void {
    this.programService.GetAllPrograms().subscribe({
      next: (allData: any): void => {
        this.programs = allData?.data?.dataList || [];
      },
      error: (error: any): void => {
        console.error('Get programs error:', error);
        swal('Error!', 'Unable to load programs.', 'error');
      },
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete programs.',
        'warning',
      );
      return;
    }
    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this program?',
      icon: 'warning',
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        this.programService.DeleteProgramById(ID).subscribe({
          next: (): void => {
            swal('Deleted!', 'Program has been deleted!', 'success');
            this.GetAllPrograms();
          },
          error: (error: any): void => {
            console.error('Delete program error:', error);
            swal(
              'Error!',
              error?.error?.message || 'Unable to delete program.',
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

        if (!this.isEditProgram && !this.programObj.status) {
          const activeStatus = this.allStatus.find(
            (status: any) => String(status.name).toLowerCase() === 'active',
          );

          if (activeStatus) {
            this.programObj.status = activeStatus.id;
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
    this.programObj.status = select.value === '' ? null : select.value;
  }

  ClearForm(): void {
    this.programObj = {};
    this.statusValue = 'Select Value';
    this.isEditProgram = false;
    this.selectedProgramId = null;

    const activeStatus = this.allStatus.find(
      (status: any) =>
        String(status.name ?? status.statusName ?? '')
          .trim()
          .toLowerCase() === 'active',
    );

    if (activeStatus) {
      this.programObj.status = activeStatus.id;
      this.statusValue = activeStatus.name ?? activeStatus.statusName;
    }
  }
  searchText: string = '';
  selectedProgramId: any = null;

  get filteredPrograms(): any[] {
    const search = this.searchText.trim().toLowerCase();

    return (this.programs || []).filter((program: any) => {
      const name = String(program.programName || '').toLowerCase();
      const code = String(program.programCode || '').toLowerCase();
      const description = String(program.description || '').toLowerCase();

      return (
        name.includes(search) ||
        code.includes(search) ||
        description.includes(search)
      );
    });
  }

  SelectProgramRow(program: any): void {
    this.selectedProgramId = program.id;

    this.programObj = {
      ...program,
      status: this.getStatusId(program.status),
    };

    this.statusValue =
      program.status?.name ||
      this.getStatusName(program.status) ||
      'Select Value';

    this.isEditProgram = true;
  }
  formatTime(value: any): string {
    if (!value) {
      return '';
    }

    const parts = String(value).split(':');

    if (parts.length < 2) {
      return String(value);
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
      return String(value);
    }

    const period = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
  }

  isProgramActive(program: any): boolean {
    const status = program._pendingStatus ?? program.status;

    let statusName = '';

    if (status && typeof status === 'object') {
      statusName = status.name ?? status.statusName ?? status.label ?? '';
    } else {
      const match = this.allStatus.find(
        (item: any) => String(item.id) === String(status),
      );

      statusName = match?.name ?? match?.statusName ?? '';
    }

    return this.normalizeStatusName(statusName) === 'active';
  }

  onStatusToggle(program: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentlyActive = this.isProgramActive(program);
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

    program._pendingStatus = selectedStatus;
    program.statusChanged = true;
  }

  saveProgramStatus(program: any): void {
    if (!this.canUpdate) {
      swal(
        'Permission denied',
        'You do not have permission to update program status.',
        'warning',
      );
      return;
    }
    const selectedStatus = program._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const payload: any = {
      ...program,
      status: selectedStatus.id,
    };

    delete payload._pendingStatus;
    delete payload.statusChanged;

    this.programService.createProgram(payload, 'Update').subscribe({
      next: (): void => {
        swal('Successful!', 'Program status has been updated!', 'success');

        this.GetAllPrograms();
      },

      error: (error: any): void => {
        console.error('Program status update error:', error);

        swal(
          'Error!',
          error?.error?.message ||
            error?.error?.error ||
            'Unable to update program status.',
          'error',
        );

        this.GetAllPrograms();
      },
    });
  }

  private getStatusName(status: any): string {
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
  private normalizeStatusName(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  private findStatusByName(name: string): any {
    const expectedName = this.normalizeStatusName(name);

    return this.allStatus.find((status: any) => {
      const actualName =
        status?.name ?? status?.statusName ?? status?.label ?? '';

      return this.normalizeStatusName(actualName) === expectedName;
    });
  }
}
