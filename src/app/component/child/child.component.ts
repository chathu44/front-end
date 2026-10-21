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

@Component({
  selector: 'app-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.scss'],
})
export class ChildComponent {
  childObj: ChildRepresentation = {};

  children: Array<any> = [];

  allParents: Array<any> = [];

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
    if (this.isEditChild ? !this.canUpdate : !this.canCreate) {
      swal(
        'Permission denied',
        this.isEditChild
          ? 'You do not have permission to update children.'
          : 'You do not have permission to register children.',
        'warning',
      );
      return;
    }
    this.type = this.isEditChild === false ? 'Add' : 'Update';

    let statusId: any = this.childObj.status;

    if (statusId && typeof statusId === 'object') {
      statusId = statusId.id;
    }

    if (!statusId) {
      const activeStatus = this.allStatus.find(
        (status: any) => String(status.name).toLowerCase() === 'active',
      );

      if (activeStatus) {
        statusId = activeStatus.id;
      }
    }

    if (!statusId) {
      swal(
        'Error!',
        'Status is required. Please check that statuses have loaded.',
        'error',
      );
      return;
    }

    const childToSave: ChildRepresentation = {
      ...this.childObj,
      status: statusId,
    };

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'That you want to Add this details?',
        icon: 'warning',
        dangerMode: true,
      }).then((willAdd: boolean) => {
        if (willAdd) {
          this.childService.createChild(childToSave, this.type).subscribe({
            next: (result: any): void => {
              this.GetAllChildren();
              swal('Successful!', 'Child has been Added!', 'success');
              this.ClearForm();
            },
            error: (error: any): void => {
              console.log('Add child error:', error);
              console.log('Backend response:', error?.error);

              swal(
                'Error!',
                error?.error?.message || 'Unable to add child.',
                'error',
              );
            },
          });
        }
      });
    } else {
      this.childService.createChild(childToSave, this.type).subscribe({
        next: (result: any): void => {
          this.GetAllChildren();
          swal('Successful!', 'Child has been updated!', 'success');
          this.ClearForm();
        },
        error: (error: any): void => {
          console.log('Update child error:', error);
          console.log('Backend response:', error?.error);

          swal(
            'Error!',
            error?.error?.message || 'Unable to update child.',
            'error',
          );
        },
      });
    }
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

            swal('Error!', 'Unable to delete child.', 'error');
          },
        });
      }
    });
  }

  GetAllParents(): void {
    this.childService.GetAllParents().subscribe((allData: any) => {
      this.allParents = allData?.data?.dataList || [];
    });
  }

  onChangeParent(E: any): void {
    const value = E.target.value;

    this.childObj.parent = value === '' ? null : value;

    const selectedParent = this.allParents.find(
      (parent: any) => String(parent.id) === String(value),
    );

    if (selectedParent) {
      this.parentValue = selectedParent.fullName;
    }
  }

  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe((allData: any) => {
      this.allStatus = allData?.data?.dataList || [];
    });
    console.table(
      this.allStatus.map((status: any) => ({
        id: status.id,
        name: status.name,
        statusName: status.statusName,
      })),
    );
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

    // Accept JPG, JPEG, and PNG files only.
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

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

    // Maximum file size: 5 MB.
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      swal('File Too Large', 'Photo size must be less than 5 MB.', 'warning');

      input.value = '';
      this.selectedPhotoFile = null;
      return;
    }

    this.selectedPhotoFile = file;

    const reader = new FileReader();

    reader.onload = (): void => {
      if (typeof reader.result !== 'string') {
        swal('Error!', 'Unable to read the selected photo.', 'error');
        return;
      }

      // Display the selected photo.
      this.photoPreviewUrl = reader.result;

      // Include the image data in the JSON payload sent to the API.
      this.childObj.photoUrl = reader.result;
    };

    reader.onerror = (): void => {
      swal('Error!', 'Unable to read the selected photo.', 'error');
    };

    reader.readAsDataURL(file);
  }

  getPhotoUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return '';
    }

    const value = photoUrl.trim();

    if (/^(https?:\/\/|data:image\/)/i.test(value)) {
      return value;
    }

    return `http://localhost:8010${
      value.startsWith('/') ? value : '/' + value
    }`;
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

    this.statusValue = '';

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

  isChildActive(child: any): boolean {
    const status = child._pendingStatus ?? child.status;

    return this.normalizeStatusName(this.getStatusName(status)) === 'active';
  }

  onStatusToggle(child: any, event: Event): void {
    const input = event.target as HTMLInputElement;

    const requestedStatus = input.checked ? 'Active' : 'Inactive';
    const currentlyActive = this.isChildActive(child);

    const selectedStatus = this.findStatusByName(requestedStatus);

    // A valid status record, including its database ID, is required.
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
    const selectedStatus = child._pendingStatus;

    if (!selectedStatus || selectedStatus.id == null) {
      swal('Error!', 'Please select a valid status.', 'error');
      return;
    }

    const childToUpdate: any = {
      ...child,
      status: selectedStatus.id,
    };

    // Remove temporary frontend-only properties.
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
