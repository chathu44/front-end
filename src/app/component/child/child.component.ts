import { Component } from '@angular/core';
import { ChildRepresentation } from '../services/api/module/child-representation';
import { ChildService } from '../services/api/child/child.service';
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
  isValidPersonName,
  scrollPageToTop,
} from '../services/lookup-utils';

@Component({
  selector: 'app-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.scss'],
})
export class ChildComponent {
  childObj: ChildRepresentation = {};

  children: Array<any> = [];

  allParents: Array<any> = [];
  allParents$: Observable<any[]> = of([]);
  childStatusOptions$: Observable<any[]> = of([]);
  readonly maxDate = this.localToday();

  parentValue: any = '';

  allStatus: Array<any> = [];

  statusValue: any = '';

  type: string = '';

  isEditChild: boolean = false;

  canView = false;

  canCreate = false;

  canUpdate = false;

  canDelete = false;

  searchText: string = '';

  selectedChildId: any = null;

  selectedPhotoFile: File | null = null;

  photoPreviewUrl: string | null = null;

  readonly genderOptions = ['Male', 'Female', 'Other'];
  readonly bloodGroupOptions = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  dtDynamicVerticalScrollExample: any;

  constructor(
    private childService: ChildService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isEditChild = false;

    this.canView = this.permissionHelper.has(AuthIds.CHILD_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.CHILD_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.CHILD_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.CHILD_DELETE);

    console.log('Child permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.GetAllParents();
    this.GetAllStatus();
    this.GetAllChildren();
  }
  SaveChild(): void {
    const isAdding = !this.isEditChild;

    if (isAdding ? !this.canCreate : !this.canUpdate) {
      swal(
        'Permission denied',
        isAdding
          ? 'You do not have permission to register children.'
          : 'You do not have permission to update children.',
        'warning',
      );
      return;
    }

    const firstName = String(this.childObj.firstName ?? '').trim();
    const lastName = String(this.childObj.lastName ?? '').trim();
    const dateOfBirth = String(this.childObj.dateOfBirth ?? '').trim();
    const parentId =
      this.childObj.parent && typeof this.childObj.parent === 'object'
        ? this.childObj.parent.id
        : this.childObj.parent;

    if (!isValidPersonName(firstName, 80)) {
      swal(
        'Validation error',
        'First name must contain 2–80 characters.',
        'warning',
      );
      return;
    }
    if (!isValidPersonName(lastName, 80)) {
      swal(
        'Validation error',
        'Last name must contain 2–80 characters.',
        'warning',
      );
      return;
    }
    if (
      !dateOfBirth ||
      dateOfBirth > this.maxDate ||
      Number.isNaN(new Date(dateOfBirth + 'T00:00:00').getTime())
    ) {
      swal(
        'Validation error',
        'Enter a valid date of birth that is not in the future.',
        'warning',
      );
      return;
    }
    if (
      !['Male', 'Female', 'Other'].includes(String(this.childObj.gender ?? ''))
    ) {
      swal('Validation error', 'Please select a gender.', 'warning');
      return;
    }
    if (String(this.childObj.allergies ?? '').trim().length > 255) {
      swal(
        'Validation error',
        'Allergy details cannot exceed 255 characters.',
        'warning',
      );
      return;
    }
    if (String(this.childObj.medicalNotes ?? '').length > 2000) {
      swal(
        'Validation error',
        'Medical notes cannot exceed 2,000 characters in this form.',
        'warning',
      );
      return;
    }
    if (parentId === null || parentId === undefined || parentId === '') {
      swal(
        'Validation error',
        'Please select a registered parent or guardian.',
        'warning',
      );
      return;
    }

    this.childObj.firstName = firstName;
    this.childObj.lastName = lastName;
    this.childObj.parent = parentId;

    const operation = isAdding ? 'Add' : 'Update';

    this.type = operation;

    let statusId: any = this.childObj.status;

    if (statusId && typeof statusId === 'object') {
      statusId = statusId.id;
    }

    if (statusId === null || statusId === undefined || statusId === '') {
      const activeStatus = this.allStatus.find(
        (status: any) =>
          String(status.name ?? status.statusName ?? '').toLowerCase() ===
          'active',
      );

      if (activeStatus) {
        statusId = activeStatus.id;
      }
    }

    if (statusId === null || statusId === undefined || statusId === '') {
      swal(
        'Error!',
        'Status is required. Please check that statuses have loaded.',
        'error',
      );
      return;
    }

    const uploadAndSave = (): void => {
      if (this.selectedPhotoFile) {
        this.childService.uploadChildPhoto(this.selectedPhotoFile).subscribe({
          next: (response: { photoUrl: string }): void => {
            if (!response?.photoUrl) {
              swal(
                'Error!',
                'The backend did not return the uploaded photo path.',
                'error',
              );
              return;
            }

            const childToSave: ChildRepresentation = {
              ...this.childObj,
              status: statusId,
              photoUrl: response.photoUrl,
            };

            this.saveChildRecord(childToSave, operation);
          },

          error: (error: any): void => {
            console.error('Child photo upload error:', error);

            swal(
              'Photo Upload Failed',
              error?.error?.message || 'Unable to upload the child photo.',
              'error',
            );
          },
        });

        return;
      }

      const childToSave: ChildRepresentation = {
        ...this.childObj,
        status: statusId,
      };

      this.saveChildRecord(childToSave, operation);
    };

    if (isAdding) {
      swal({
        title: 'Are you sure?',
        text: 'Do you want to register this child?',
        icon: 'warning',
        dangerMode: true,
      }).then((willAdd: boolean) => {
        if (willAdd) {
          uploadAndSave();
        }
      });
    } else {
      uploadAndSave();
    }
  }

  private saveChildRecord(
    childToSave: ChildRepresentation,
    operation: string,
  ): void {
    this.childService.createChild(childToSave, operation).subscribe({
      next: (): void => {
        this.GetAllChildren();

        swal(
          'Successful!',
          operation === 'Add'
            ? 'Child has been registered successfully!'
            : 'Child details have been updated successfully!',
          'success',
        );

        this.ClearForm();
      },

      error: (error: any): void => {
        console.error('Save child error:', error);
        console.error('Backend response:', error?.error);

        swal(
          'Error!',
          error?.error?.message || 'Unable to save the child details.',
          'error',
        );
      },
    });
  }

  GetChildById(ID: any): void {
    this.childService.GetChildById(ID).subscribe((allData: any) => {
      const record = allData?.data?.dataList?.[0];

      if (!record) {
        return;
      }

      this.childObj = {
        ...record,
      };

      this.isEditChild = true;

      this.selectedChildId = record.id;

      this.parentValue =
        record.parent?.fullName || record.parent?.id || 'Select Value';

      this.childObj.parent = record.parent?.id ?? record.parent ?? null;

      this.statusValue =
        record.status?.name || record.status?.id || 'Select Value';

      this.childObj.status = record.status?.id ?? record.status ?? null;

      if (record.photoUrl) {
        this.photoPreviewUrl = this.getPhotoUrl(record.photoUrl);
      } else {
        this.photoPreviewUrl = null;
      }

      this.selectedPhotoFile = null;
      scrollPageToTop();
    });
  }

  SelectChildRow(child: any): void {
    this.selectedChildId = child.id;

    this.GetChildById(child.id);
  }

  GetAllChildren(): void {
    this.childService.GetAllChildren().subscribe((allData: any) => {
      this.children = allData?.data?.dataList || [];
    });
  }

  DeleteById(ID: any): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete children.',
        'warning',
      );
      return;
    }
    swal({
      title: 'Are you sure',
      text: 'That you want to Delete this Child?',
      icon: 'warning',
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        this.childService.DeleteChildById(ID).subscribe({
          next: (allData: any): void => {
            this.GetAllChildren();

            if (String(this.selectedChildId) === String(ID)) {
              this.ClearForm();
            }

            swal('Deleted!', 'Child has been deleted!', 'success');
          },

          error: (error: any): void => {
            console.log(error);

            const message =
              error?.error?.message ||
              (error?.status === 403
                ? 'The API denied deletion. Confirm CHILD_DELETE exists and is assigned to your user or privilege group, then sign in again.'
                : error?.status === 409 || error?.status === 500
                  ? 'The child may be referenced by enrollments, attendance, meal records, or incidents. Retain the record and change its lifecycle status instead.'
                  : 'Unable to delete child. Check the Network tab and Spring Boot console.');
            swal('Delete failed', message, 'error');
          },
        });
      }
    });
  }

  GetAllParents(): void {
    this.allParents$ = this.childService.GetAllParents().pipe(
      map((response: any) => unwrapApiList(response)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.allParents$.subscribe({
      next: (parents: any[]) => (this.allParents = parents),
      error: (error: any) => {
        console.error('Get parents error:', error);
        this.allParents = [];
        swal('Error!', 'Unable to load parents.', 'error');
      },
    });
  }

  onChangeParent(value: any): void {
    const parentId = value === '' || value == null ? null : value;
    this.childObj.parent = parentId;
    const selectedParent = this.allParents.find(
      (parent: any) => String(parent.id) === String(parentId),
    );
    this.parentValue = selectedParent?.fullName ?? '';
  }

  GetAllStatus(): void {
    const statuses$ = this.statusService.GetAllStatus().pipe(
      map((response: any) => unwrapApiList(response)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.childStatusOptions$ = statuses$.pipe(
      map((statuses: any[]) =>
        filterStatusOptions(statuses, ['Active', 'Withdrawn', 'Graduated']),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    statuses$.subscribe({
      next: (statuses: any[]) => {
        this.allStatus = statuses;
        if (!this.isEditChild && !this.childObj.status) {
          const activeStatus = statuses.find(
            (status: any) =>
              normalizeLookupName(status?.name ?? status?.statusName) ===
              'active',
          );
          if (activeStatus) {
            this.childObj.status = activeStatus.id;
            this.statusValue = activeStatus.name ?? activeStatus.statusName;
          }
        }
      },
      error: (error: any) => {
        console.error('Get statuses error:', error);
        this.allStatus = [];
        swal('Error!', 'Unable to load statuses.', 'error');
      },
    });
  }

  onChangeStatus(E: any): void {
    const value = E.target.value;

    this.childObj.status = value === '' ? null : value;

    const selectedStatus = this.allStatus.find(
      (status: any) => String(status.id) === String(value),
    );

    if (selectedStatus) {
      this.statusValue = selectedStatus.name;
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      swal(
        'Invalid Photo',
        'Please select a JPG, JPEG or PNG image.',
        'warning',
      );

      input.value = '';
      this.selectedPhotoFile = null;
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      swal('File Too Large', 'Photo size must not exceed 5 MB.', 'warning');

      input.value = '';
      this.selectedPhotoFile = null;
      return;
    }

    this.selectedPhotoFile = file;

    const reader = new FileReader();

    reader.onload = (): void => {
      if (typeof reader.result === 'string') {
        this.photoPreviewUrl = reader.result;
      } else {
        swal('Error!', 'Unable to preview the selected photo.', 'error');
      }
    };

    reader.onerror = (): void => {
      swal('Error!', 'Unable to read the selected photo.', 'error');
    };

    reader.readAsDataURL(file);
  }

  getPhotoUrl(photoUrl: string | null | undefined): string {
    if (!photoUrl) {
      return '';
    }

    const value = photoUrl.trim();

    if (/^(https?:\/\/|data:image\/)/i.test(value)) {
      return value;
    }

    const normalizedPath = value.replace(/\\/g, '/').replace(/^\/+/, '');

    return `http://localhost:8010/${normalizedPath}`;
  }

  get filteredChildren(): any[] {
    if (!this.children) {
      return [];
    }

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.children;
    }

    return this.children.filter((child: any) => {
      const firstName = String(child.firstName || '').toLowerCase();

      const lastName = String(child.lastName || '').toLowerCase();

      const childCode = String(child.childCode || child.id || '').toLowerCase();

      const fullName = `${firstName} ${lastName}`;

      return (
        firstName.includes(search) ||
        lastName.includes(search) ||
        fullName.includes(search) ||
        childCode.includes(search)
      );
    });
  }

  ClearForm(): void {
    this.childObj = {};

    this.parentValue = '';
    this.statusValue = 'Active';

    const activeStatus = this.allStatus.find(
      (status: any) =>
        normalizeLookupName(status?.name ?? status?.statusName) === 'active',
    );
    if (activeStatus) this.childObj.status = activeStatus.id;

    this.isEditChild = false;

    this.type = '';

    this.selectedChildId = null;

    this.selectedPhotoFile = null;

    this.photoPreviewUrl = null;

    const photoInput = document.getElementById(
      'childPhoto',
    ) as HTMLInputElement;

    if (photoInput) {
      photoInput.value = '';
    }
  }

  statusOptionId(status: any): string | number | null {
    if (status && typeof status === 'object') return status.id ?? null;
    return status == null || status === '' ? null : status;
  }

  onChildStatusChange(child: any, statusId: any): void {
    const selectedStatus = findStatusById(this.allStatus, statusId);
    if (!selectedStatus) {
      delete child._pendingStatus;
      child.statusChanged = false;
      return;
    }

    if (
      String(this.statusOptionId(child.status)) === String(selectedStatus.id)
    ) {
      delete child._pendingStatus;
      child.statusChanged = false;
      return;
    }

    child._pendingStatus = selectedStatus;
    child.statusChanged = true;
  }

  private localToday(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  isChildActive(child: any): boolean {
    const status = child._pendingStatus ?? child.status;

    return this.normalizeStatusName(this.getStatusName(status)) === 'active';
  }

  onStatusToggle(child: any, event: Event): void {
    const input = event.target as HTMLInputElement;

    const requestedStatus = input.checked ? 'Active' : 'Inactive';
    const currentlyActive = this.isChildActive(child);

    const selectedStatus = this.findStatusByName(requestedStatus);

    if (
      !selectedStatus ||
      selectedStatus.id === null ||
      selectedStatus.id === undefined
    ) {
      input.checked = currentlyActive;

      swal(
        'Status Not Available',
        `${requestedStatus} status was not found in the status list returned by the API.`,
        'warning',
      );

      return;
    }

    child._pendingStatus = selectedStatus;
    child.statusChanged = true;
  }

  saveChildStatus(child: any): void {
    if (!this.canUpdate) {
      swal(
        'Permission denied',
        'You do not have permission to update child status.',
        'warning',
      );
      return;
    }
    const selectedStatus = child._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const childToUpdate: any = {
      ...child,
      status: selectedStatus.id,
    };

    delete childToUpdate._pendingStatus;
    delete childToUpdate.statusChanged;

    this.childService.createChild(childToUpdate, 'Update').subscribe({
      next: (): void => {
        child.status = selectedStatus;

        delete child._pendingStatus;
        delete child.statusChanged;

        swal('Successful!', 'Child status has been updated!', 'success');

        this.GetAllChildren();
      },

      error: (error: any): void => {
        console.error('Child status update error:', error);

        delete child._pendingStatus;
        delete child.statusChanged;

        swal(
          'Error!',
          error?.error?.message || 'Unable to update child status.',
          'error',
        );

        this.GetAllChildren();
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
