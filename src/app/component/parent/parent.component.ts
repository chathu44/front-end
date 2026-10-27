import { Component, OnInit } from '@angular/core';
import { ParentRepresentation } from '../services/api/module/parent-representation';
import { ParentService } from '../services/api/parent/parent.service';
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
  normalizeSriLankanPhone,
  isValidEmailAddress,
  isValidPersonName,
  scrollPageToTop,
} from '../services/lookup-utils';

@Component({
  selector: 'app-parent',
  standalone: false,
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.scss'],
})
export class ParentComponent implements OnInit {
  parentObj: ParentRepresentation = {};
  parents: Array<any> = [];
  allStatus: Array<any> = [];
  parentStatusOptions$: Observable<any[]> = of([]);
  statusValue: any;
  type = '';
  isEditParent = false;
  dtDynamicVerticalScrollExample: any;
  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  readonly relationshipOptions = ['Mother', 'Father', 'Guardian', 'Other'];

  constructor(
    private parentService: ParentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.canView = this.permissionHelper.has(AuthIds.PARENT_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.PARENT_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.PARENT_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.PARENT_DELETE);

    console.log('Parent permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.GetAllStatus();
    this.GetAllParents();
  }

  SaveParent(): void {
    if (this.isEditParent ? !this.canUpdate : !this.canCreate) {
      swal(
        'Permission denied',
        this.isEditParent
          ? 'You do not have permission to update parents.'
          : 'You do not have permission to register parents.',
        'warning',
      );
      return;
    }

    const fullName = String(this.parentObj.fullName ?? '').trim();
    const phone = String(this.parentObj.phone ?? '').trim();
    const alternatePhone = String(this.parentObj.alternatePhone ?? '').trim();
    const email = String(this.parentObj.email ?? '').trim();
    const nic = String(this.parentObj.nic ?? '').trim();
    const normalizedPhone = normalizeSriLankanPhone(phone);
    const normalizedAlternatePhone = alternatePhone
      ? normalizeSriLankanPhone(alternatePhone)
      : '';
    const nicPattern = /^(?:[0-9]{9}[vVxX]|[0-9]{12})$/;

    if (!isValidPersonName(fullName, 150)) {
      swal(
        'Validation error',
        'Enter a valid full name (2–150 characters, letters, spaces, initials, apostrophes or hyphens).',
        'warning',
      );
      return;
    }
    if (!normalizedPhone) {
      swal(
        'Validation error',
        'Enter a valid Sri Lankan phone number, for example 077 123 4567 or +94 77 123 4567.',
        'warning',
      );
      return;
    }
    if (alternatePhone && !normalizedAlternatePhone) {
      swal(
        'Validation error',
        'Enter a valid Sri Lankan alternate phone number or leave it blank.',
        'warning',
      );
      return;
    }
    if (!isValidEmailAddress(email, 100)) {
      swal(
        'Validation error',
        'Enter a valid email address of at most 100 characters, or leave it blank.',
        'warning',
      );
      return;
    }

    if (nic && !nicPattern.test(nic)) {
      swal(
        'Validation error',
        'NIC must be 9 digits followed by V/X or 12 digits.',
        'warning',
      );
      return;
    }

    this.parentObj.fullName = fullName;
    this.parentObj.phone = normalizedPhone!;
    this.parentObj.alternatePhone = normalizedAlternatePhone || undefined;
    this.parentObj.email = email || undefined;
    this.parentObj.nic = nic || undefined;

    this.type = this.isEditParent ? 'Update' : 'Add';

    const statusId = this.getStatusId(this.parentObj.status);

    if (statusId === null || statusId === undefined || statusId === '') {
      swal('Missing Status', 'Please select a status.', 'warning');
      return;
    }

    const parentToSave: ParentRepresentation = {
      ...this.parentObj,
      status: statusId,
    };

    const saveParent = (): void => {
      this.parentService.createParent(parentToSave, this.type).subscribe({
        next: (): void => {
          swal(
            'Successful!',
            this.type === 'Add'
              ? 'Parent has been added!'
              : 'Parent has been updated!',
            'success',
          );
          this.GetAllParents();
          this.ClearForm();
        },
        error: (error: any): void => {
          console.error('Parent save error:', error);
          swal(
            'Error!',
            error?.error?.message ||
              error?.error?.error ||
              'Unable to save parent. Please check the entered details.',
            'error',
          );
        },
      });
    };

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'Do you want to add this parent?',
        icon: 'warning',
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          saveParent();
        }
      });
    } else {
      saveParent();
    }
  }

  private getStatusId(status: any): string | number | null {
    if (status && typeof status === 'object') {
      return status.id ?? null;
    }

    return status === '' || status === undefined ? null : status;
  }

  GetParentById(ID: any): void {
    this.parentService.GetParentById(ID).subscribe({
      next: (allData: any): void => {
        const record = allData?.data?.dataList?.[0];

        if (!record) {
          swal('Error!', 'Parent record was not found.', 'error');
          return;
        }

        this.parentObj = {
          ...record,
          status: record.status?.id ?? record.status ?? null,
        };

        this.statusValue = record.status?.name || 'Select Value';
        this.isEditParent = true;

        this.selectedParentId = record.id;
        scrollPageToTop();
      },
      error: (error: any): void => {
        console.error('Get parent error:', error);
        swal('Error!', 'Unable to load parent details.', 'error');
      },
    });
  }

  GetAllParents(): void {
    this.parentService.GetAllParents().subscribe({
      next: (allData: any): void => {
        this.parents = allData?.data?.dataList || [];
      },
      error: (error: any): void => {
        console.error('Get parents error:', error);
        swal('Error!', 'Unable to load parents.', 'error');
      },
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete parents.',
        'warning',
      );
      return;
    }
    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this parent?',
      icon: 'warning',
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        this.parentService.DeleteParentById(ID).subscribe({
          next: (): void => {
            swal('Deleted!', 'Parent has been deleted!', 'success');
            this.GetAllParents();
          },
          error: (error: any): void => {
            console.error('Delete parent error:', error);
            swal(
              'Error!',
              error?.error?.message ||
                (error?.status === 403
                  ? 'The API denied deletion. Confirm PARENT_DELETE exists and is assigned to your user or privilege group, then sign in again.'
                  : error?.status === 409 || error?.status === 500
                    ? 'This parent may be linked to children or other records. Deactivate the parent rather than deleting linked history.'
                    : 'Unable to delete parent. Check the Network tab and Spring Boot console.'),
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

    this.parentStatusOptions$ = statuses$.pipe(
      map((statuses: any[]) =>
        filterStatusOptions(statuses, ['Active', 'Inactive']),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    statuses$.subscribe({
      next: (statuses: any[]): void => {
        this.allStatus = statuses;
        if (!this.isEditParent && !this.parentObj.status) {
          const activeStatus = findStatusById(
            statuses,
            statuses.find(
              (item: any) =>
                normalizeLookupName(item?.name ?? item?.statusName) ===
                'active',
            )?.id,
          );
          if (activeStatus) this.parentObj.status = activeStatus.id;
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
    this.parentObj.status = select.value === '' ? null : select.value;
  }

  ClearForm(): void {
    this.parentObj = {};
    this.statusValue = 'Active';
    this.isEditParent = false;

    const activeStatus = this.allStatus.find(
      (status: any) =>
        normalizeLookupName(status?.name ?? status?.statusName) === 'active',
    );

    if (activeStatus) {
      this.parentObj.status = activeStatus.id;
      this.statusValue =
        activeStatus.name ?? activeStatus.statusName ?? 'Active';
    }
    this.selectedParentId = null;
  }

  searchText: string = '';
  selectedParentId: any = null;

  get filteredParents(): any[] {
    const search = this.searchText.toLowerCase().trim();

    return (this.parents || []).filter((parent: any) => {
      const name = String(
        parent.fullName || parent.parentName || '',
      ).toLowerCase();

      const code = String(parent.parentCode || '').toLowerCase();

      const phone = String(parent.phone || '').toLowerCase();

      return (
        name.includes(search) || code.includes(search) || phone.includes(search)
      );
    });
  }

  SelectParentRow(parent: any): void {
    this.selectedParentId = parent.id;

    this.parentObj = {
      ...parent,
      status: this.getStatusId(parent.status),
    };

    this.statusValue = this.getStatusName(parent.status) || 'Select Value';

    this.isEditParent = true;
    scrollPageToTop();
  }

  isParentActive(parent: any): boolean {
    const status = parent._pendingStatus ?? parent.status;

    return this.normalizeStatusName(this.getStatusName(status)) === 'active';
  }

  onStatusToggle(parent: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentlyActive = this.isParentActive(parent);

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

    parent._pendingStatus = selectedStatus;
    parent.statusChanged = true;
  }

  saveParentStatus(parent: any): void {
    if (!this.canUpdate) {
      swal(
        'Permission denied',
        'You do not have permission to update parent status.',
        'warning',
      );
      return;
    }
    const selectedStatus = parent._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const payload: any = {
      ...parent,
      status: selectedStatus.id,
    };

    delete payload._pendingStatus;
    delete payload.statusChanged;

    this.parentService.createParent(payload, 'Update').subscribe({
      next: (): void => {
        parent.status = selectedStatus;

        delete parent._pendingStatus;
        delete parent.statusChanged;

        swal('Successful!', 'Parent status has been updated!', 'success');

        this.GetAllParents();
      },

      error: (error: any): void => {
        console.error('Parent status update error:', error);

        delete parent._pendingStatus;
        delete parent.statusChanged;

        swal('Error!', 'Unable to update parent status.', 'error');

        this.GetAllParents();
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
