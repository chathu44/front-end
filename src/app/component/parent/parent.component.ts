import { Component } from '@angular/core';
import { ParentRepresentation } from '../services/api/module/parent-representation';
import { ParentService } from '../services/api/parent/parent.service';
import { StatusService } from '../services/api/status/status.service';
import swal from 'sweetalert';

@Component({
  selector: 'app-parent',
  standalone: false,
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.scss'],
})
export class ParentComponent {

  parentObj: ParentRepresentation = {};

  parents: Array<any> = [];

  allStatus: Array<any> = [];

  statusValue: any = '';

  type: string = '';

  isEditParent: boolean = false;

  canCreate: boolean = true;
  canUpdate: boolean = true;
  canDelete: boolean = true;

  searchText: string = '';

  selectedParentId: any = null;

  constructor(
    private parentService: ParentService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {

    this.isEditParent = false;

    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;

    this.GetAllStatus();
    this.GetAllParents();
  }

  SaveParent(): void {

    this.type =
      this.isEditParent === false
        ? 'Add'
        : 'Update';

    if (
      this.type === 'Add' &&
      (
        this.parentObj.status === null ||
        this.parentObj.status === undefined ||
        this.parentObj.status === ''
      )
    ) {

      const activeStatus =
        this.allStatus.find(
          (status: any) =>
            String(status.name)
              .toLowerCase() === 'active'
        );

      if (!activeStatus) {
        swal(
          'Error!',
          'Active status was not found.',
          'error'
        );
        return;
      }

      this.parentObj.status =
        activeStatus.id;
    }

    if (this.type === 'Add') {

      swal({
        title: 'Are you sure?',
        text: 'That you want to register this parent?',
        icon: 'warning',
        dangerMode: true,
      }).then((willAdd) => {

        if (willAdd) {

          this.parentService
            .createParent(
              this.parentObj,
              this.type
            )
            .subscribe({

              next: (result: any): void => {

                this.GetAllParents();

                swal(
                  'Successful!',
                  'Parent has been registered!',
                  'success'
                );

                this.ClearForm();
              },

              error: (error: any): void => {

                console.log(error);

                swal(
                  'Error!',
                  'Unable to register parent.',
                  'error'
                );
              }

            });
        }

      });

    } else {

      this.parentService
        .createParent(
          this.parentObj,
          this.type
        )
        .subscribe({

          next: (result: any): void => {

            this.GetAllParents();

            swal(
              'Successful!',
              'Parent has been updated!',
              'success'
            );

            this.ClearForm();
          },

          error: (error: any): void => {

            console.log(error);

            swal(
              'Error!',
              'Unable to update parent.',
              'error'
            );
          }

        });
    }
  }

  GetParentById(
    ID: any
  ): void {

    this.parentService
      .GetParentById(ID)
      .subscribe((allData: any) => {

        const record =
          allData?.data?.dataList?.[0];

        if (!record) {
          return;
        }

        this.parentObj = {
          ...record
        };

        this.isEditParent = true;

        this.selectedParentId =
          record.id;

        this.statusValue =
          record.status?.name ||
          record.status?.id ||
          '';

        this.parentObj.status =
          record.status?.id ??
          record.status ??
          null;
      });
  }

  SelectParentRow(
    parent: any
  ): void {

    this.selectedParentId =
      parent.id;

    this.GetParentById(
      parent.id
    );
  }

  GetAllParents(): void {

    this.parentService
      .GetAllParents()
      .subscribe((allData: any) => {

        this.parents =
          allData?.data?.dataList ||
          [];
      });
  }

  DeleteById(
    ID: any
  ): void {

    swal({
      title: 'Are you sure?',
      text: 'That you want to delete this parent?',
      icon: 'warning',
      dangerMode: true,
    }).then((willDelete) => {

      if (willDelete) {

        this.parentService
          .DeleteParentById(ID)
          .subscribe({

            next: (result: any): void => {

              this.GetAllParents();

              if (
                String(this.selectedParentId) ===
                String(ID)
              ) {
                this.ClearForm();
              }

              swal(
                'Deleted!',
                'Parent has been deleted!',
                'success'
              );
            },

            error: (error: any): void => {

              console.log(error);

              swal(
                'Error!',
                'Unable to delete parent.',
                'error'
              );
            }

          });
      }

    });
  }

  GetAllStatus(): void {

    this.statusService
      .GetAllStatus()
      .subscribe((allData: any) => {

        this.allStatus =
          allData?.data?.dataList ||
          [];
      });
  }

  isParentActive(
    parent: any
  ): boolean {

    return String(
      parent.status?.name || ''
    ).toLowerCase() === 'active';
  }

  onStatusToggle(
    parent: any,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const newStatusName =
      input.checked
        ? 'Active'
        : 'Inactive';

    const selectedStatus =
      this.allStatus.find(
        (status: any) =>
          String(status.name)
            .toLowerCase() ===
          newStatusName.toLowerCase()
      );

    if (!selectedStatus) {

      swal(
        'Error!',
        `${newStatusName} status was not found.`,
        'error'
      );

      this.GetAllParents();

      return;
    }

    parent.status =
      selectedStatus;

    parent.statusChanged =
      true;
  }

  saveParentStatus(
    parent: any
  ): void {

    const parentToUpdate:
      ParentRepresentation = {
        ...parent,
        status: parent.status?.id
      };

    this.parentService
      .createParent(
        parentToUpdate,
        'Update'
      )
      .subscribe({

        next: (result: any): void => {

          parent.statusChanged =
            false;

          swal(
            'Successful!',
            'Parent status has been updated!',
            'success'
          );

          this.GetAllParents();
        },

        error: (error: any): void => {

          console.log(error);

          swal(
            'Error!',
            'Unable to update parent status.',
            'error'
          );

          this.GetAllParents();
        }

      });
  }

  get filteredParents(): any[] {

    if (!this.parents) {
      return [];
    }

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      return this.parents;
    }

    return this.parents.filter(
      (parent: any) => {

        const fullName =
          String(
            parent.fullName ||
            ''
          ).toLowerCase();

        const parentCode =
          String(
            parent.parentCode ||
            parent.id ||
            ''
          ).toLowerCase();

        const phone =
          String(
            parent.phone ||
            ''
          ).toLowerCase();

        const nic =
          String(
            parent.nic ||
            ''
          ).toLowerCase();

        return (
          fullName.includes(search) ||
          parentCode.includes(search) ||
          phone.includes(search) ||
          nic.includes(search)
        );
      }
    );
  }

  ClearForm(): void {

    this.parentObj = {};

    this.statusValue = '';

    this.isEditParent = false;

    this.type = '';

    this.selectedParentId = null;
  }
}