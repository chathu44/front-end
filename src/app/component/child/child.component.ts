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

    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;

    this.GetAllParents();
    this.GetAllStatus();
    this.GetAllChildren();
  }
  // ngOnInit(): void {

  //   this.isEditChild = false;

  //   this.canCreate =
  //     this.permissionHelper.has(
  //       AuthIds.CHILD_CREATE
  //     );

  //   this.canUpdate =
  //     this.permissionHelper.has(
  //       AuthIds.CHILD_UPDATE
  //     );

  //   this.canDelete =
  //     this.permissionHelper.has(
  //       AuthIds.CHILD_DELETE
  //     );

  //   this.GetAllParents();

  //   this.GetAllStatus();

  //   this.GetAllChildren();

  // }

  SaveChild(): void {
    this.type = this.isEditChild === false ? 'Add' : 'Update';

    if (this.type === 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'That you want to Add this details?',
        icon: 'warning',
        dangerMode: true,
      }).then((willAdd) => {
        if (willAdd) {
          this.childService.createChild(this.childObj, this.type).subscribe({
            next: (result: any): void => {
              this.GetAllChildren();

              swal('Successful!', 'Child has been Added!', 'success');

              this.ClearForm();
            },

            error: (error: any): void => {
              console.log(error);

              swal('Error!', 'Unable to add child.', 'error');
            },
          });
        }
      });
    } else {
      this.childService.createChild(this.childObj, this.type).subscribe({
        next: (result: any): void => {
          this.GetAllChildren();

          swal('Successful!', 'Child has been updated!', 'success');

          this.ClearForm();
        },

        error: (error: any): void => {
          console.log(error);

          swal('Error!', 'Unable to update child.', 'error');
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

    if (
      file.type !== 'image/jpeg' &&
      file.type !== 'image/jpg' &&
      file.type !== 'image/png'
    ) {
      swal(
        'Invalid Photo',
        'Please select a JPG, JPEG or PNG image.',
        'warning',
      );

      input.value = '';

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      swal('File Too Large', 'Photo size must be less than 5 MB.', 'warning');

      input.value = '';

      return;
    }

    this.selectedPhotoFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.photoPreviewUrl = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  getPhotoUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return '';
    }

    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      return photoUrl;
    }

    if (photoUrl.startsWith('data:image')) {
      return photoUrl;
    }

    return `http://localhost:8010${photoUrl}`;
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
    return String(child.status?.name || '').toLowerCase() === 'active';
  }

  onStatusToggle(child: any, event: Event): void {
    const input = event.target as HTMLInputElement;

    const newStatusName = input.checked ? 'Active' : 'Inactive';

    const selectedStatus = this.allStatus.find(
      (status: any) =>
        String(status.name).toLowerCase() === newStatusName.toLowerCase(),
    );

    if (!selectedStatus) {
      swal('Error!', `${newStatusName} status was not found.`, 'error');

      return;
    }

    child.status = selectedStatus;
    child.statusChanged = true;
  }

  saveChildStatus(child: any): void {
    const childToUpdate: ChildRepresentation = {
      ...child,
      status: child.status?.id,
    };

    this.childService.createChild(childToUpdate, 'Update').subscribe({
      next: (result: any): void => {
        child.statusChanged = false;

        swal('Successful!', 'Child status has been updated!', 'success');

        this.GetAllChildren();
      },

      error: (error: any): void => {
        console.log(error);

        swal('Error!', 'Unable to update child status.', 'error');

        this.GetAllChildren();
      },
    });
  }
}
