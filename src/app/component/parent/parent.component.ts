import { Component, OnInit } from '@angular/core';
import { ParentRepresentation } from '../services/api/module/parent-representation';
import { ParentService } from '../services/api/parent/parent.service';
import { StatusService } from '../services/api/status/status.service';
import { FormBuilder } from '@angular/forms';
import swal from 'sweetalert';
import {
  AuthIds,
  PermissionHelperService
} from '../services/permission-helper.service';

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
  statusValue: any;
  type = '';
  isEditParent = false;
  dtDynamicVerticalScrollExample: any;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private parentService: ParentService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder
  ) {}

  // ngOnInit(): void {
  //   this.canCreate = this.permissionHelper.has(AuthIds.PARENT_CREATE);
  //   this.canUpdate = this.permissionHelper.has(AuthIds.PARENT_UPDATE);
  //   this.canDelete = this.permissionHelper.has(AuthIds.PARENT_DELETE);

  //   this.GetAllStatus();
  //   this.GetAllParents();
  // }
  
ngOnInit(): void {
  const hasParentCrudPermission = this.permissionHelper.hasAny(
    AuthIds.PARENT_CREATE,
    AuthIds.PARENT_UPDATE,
    AuthIds.PARENT_DELETE
  );

  if (hasParentCrudPermission) {
    this.canCreate = this.permissionHelper.has(AuthIds.PARENT_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.PARENT_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.PARENT_DELETE);
  } else {
    // Frontend testing fallback when no parent CRUD permissions are assigned.
    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;
  }

  this.GetAllStatus();
  this.GetAllParents();
}


  SaveParent(): void {
    this.type = this.isEditParent ? 'Update' : 'Add';

    const statusId = this.getStatusId(this.parentObj.status);

    if (statusId === null || statusId === undefined || statusId === '') {
      swal('Missing Status', 'Please select a status.', 'warning');
      return;
    }

    const parentToSave: ParentRepresentation = {
      ...this.parentObj,
      status: statusId
    };

    const saveParent = (): void => {
      this.parentService.createParent(parentToSave, this.type).subscribe({
        next: (): void => {
          swal(
            'Successful!',
            this.type === 'Add'
              ? 'Parent has been added!'
              : 'Parent has been updated!',
            'success'
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
            'error'
          );
        }
      });
    };

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'Do you want to add this parent?',
        icon: 'warning',
        dangerMode: true
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
          status: record.status?.id ?? record.status ?? null
        };

        this.statusValue = record.status?.name || 'Select Value';
        this.isEditParent = true;

        this.selectedParentId = record.id;
      },
      error: (error: any): void => {
        console.error('Get parent error:', error);
        swal('Error!', 'Unable to load parent details.', 'error');
      }
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
      }
    });
  }

  DeleteById(ID: any): void {
    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this parent?',
      icon: 'warning',
      dangerMode: true
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
              error?.error?.message || 'Unable to delete parent.',
              'error'
            );
          }
        });
      }
    });
  }

  GetAllStatus(): void {
    this.statusService.GetAllStatus().subscribe({
      next: (allData: any): void => {
        this.allStatus = allData?.data?.dataList || [];

        if (!this.isEditParent && !this.parentObj.status) {
          const activeStatus = this.allStatus.find(
            (status: any) =>
              String(status.name).toLowerCase() === 'active'
          );

          if (activeStatus) {
            this.parentObj.status = activeStatus.id;
          }
        }
      },
      error: (error: any): void => {
        console.error('Get statuses error:', error);
        swal('Error!', 'Unable to load statuses.', 'error');
      }
    });
  }

  onChangeStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.parentObj.status = select.value === '' ? null : select.value;
  }

  ClearForm(): void {
    this.parentObj = {};
    this.statusValue = 'Select Value';
    this.isEditParent = false;

    const activeStatus = this.allStatus.find(
      (status: any) => String(status.name).toLowerCase() === 'active'
    );

    if (activeStatus) {
      this.parentObj.status = activeStatus.id;
    }
    this.selectedParentId = null;
  }

  searchText: string = '';
selectedParentId: any = null;

get filteredParents(): any[] {
  const search = this.searchText.toLowerCase().trim();

  return (this.parents || []).filter((parent: any) => {
    const name = String(
      parent.fullName || parent.parentName || ''
    ).toLowerCase();

    const code = String(
      parent.parentCode || ''
    ).toLowerCase();

    const phone = String(parent.phone || '').toLowerCase();

    return (
      name.includes(search) ||
      code.includes(search) ||
      phone.includes(search)
    );
  });
  
}


SelectParentRow(parent: any): void {
  this.selectedParentId = parent.id;

  this.parentObj = {
    ...parent,
    status: this.getStatusId(parent.status)
  };

  this.statusValue =
    this.getStatusName(parent.status) || 'Select Value';

  this.isEditParent = true;
}


isParentActive(parent: any): boolean {
  const status = parent._pendingStatus ?? parent.status;

  return (
    this.normalizeStatusName(this.getStatusName(status)) === 'active'
  );
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
      'warning'
    );

    return;
  }

  parent._pendingStatus = selectedStatus;
  parent.statusChanged = true;
}

saveParentStatus(parent: any): void {
  const selectedStatus = parent._pendingStatus;

  if (!selectedStatus || selectedStatus.id == null) {
    swal('Error!', 'Please select a valid status.', 'error');
    return;
  }

  const payload: any = {
    ...parent,
    status: selectedStatus.id
  };

  delete payload._pendingStatus;
  delete payload.statusChanged;

  this.parentService.createParent(payload, 'Update').subscribe({
    next: (): void => {
      parent.status = selectedStatus;

      delete parent._pendingStatus;
      delete parent.statusChanged;

      swal(
        'Successful!',
        'Parent status has been updated!',
        'success'
      );

      this.GetAllParents();
    },

    error: (error: any): void => {
      console.error('Parent status update error:', error);

      delete parent._pendingStatus;
      delete parent.statusChanged;

      swal('Error!', 'Unable to update parent status.', 'error');

      this.GetAllParents();
    }
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
      status?.name ??
      status?.statusName ??
      status?.label ??
      '';

    return this.normalizeStatusName(actualName) === expectedName;
  });
}

private getStatusName(status: any): string {
  if (status && typeof status === 'object') {
    const directName =
      status.name ??
      status.statusName ??
      status.label;

    if (directName) {
      return String(directName);
    }

    status = status.id;
  }

  const matchedStatus = (this.allStatus || []).find(
    (item: any) => String(item.id) === String(status)
  );

  return String(
    matchedStatus?.name ??
    matchedStatus?.statusName ??
    status ??
    ''
  );
}


}
