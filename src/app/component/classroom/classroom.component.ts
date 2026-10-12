import { Component } from '@angular/core';
import { ClassroomRepresentation } from '../services/api/module/classroom-representation';
import { ClassroomService } from '../services/api/classroom/classroom.service';
import { StatusService } from '../services/api/status/status.service';
import swal from 'sweetalert';

@Component({
  selector: 'app-classroom',
  standalone: false,
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss'],
})
export class ClassroomComponent {

  classroomObj: ClassroomRepresentation = {};

  classrooms: Array<any> = [];

  allStatus: Array<any> = [];

  statusValue: any = '';

  type: string = '';

  isEditClassroom: boolean = false;

  canCreate: boolean = true;
  canUpdate: boolean = true;
  canDelete: boolean = true;

  searchText: string = '';

  selectedClassroomId: any = null;

  constructor(
    private classroomService: ClassroomService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {

    this.isEditClassroom = false;

    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;

    this.GetAllStatus();
    this.GetAllClassrooms();
  }

  SaveClassroom(): void {

    this.type =
      this.isEditClassroom === false
        ? 'Add'
        : 'Update';


    if (
      this.type === 'Add' &&
      (
        this.classroomObj.status === null ||
        this.classroomObj.status === undefined ||
        this.classroomObj.status === ''
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

      this.classroomObj.status =
        activeStatus.id;
    }

    if (this.type === 'Add') {

      swal({
        title: 'Are you sure?',
        text: 'That you want to register this classroom?',
        icon: 'warning',
        dangerMode: true,
      }).then((willAdd) => {

        if (willAdd) {

          this.classroomService
            .createClassroom(
              this.classroomObj,
              this.type
            )
            .subscribe({

              next: (result: any): void => {

                this.GetAllClassrooms();

                swal(
                  'Successful!',
                  'Classroom has been registered!',
                  'success'
                );

                this.ClearForm();
              },

              error: (error: any): void => {

                console.log(error);

                swal(
                  'Error!',
                  'Unable to register classroom.',
                  'error'
                );
              }

            });
        }

      });

    } else {

      this.classroomService
        .createClassroom(
          this.classroomObj,
          this.type
        )
        .subscribe({

          next: (result: any): void => {

            this.GetAllClassrooms();

            swal(
              'Successful!',
              'Classroom has been updated!',
              'success'
            );

            this.ClearForm();
          },

          error: (error: any): void => {

            console.log(error);

            swal(
              'Error!',
              'Unable to update classroom.',
              'error'
            );
          }

        });
    }
  }

  GetClassroomById(
    ID: any
  ): void {

    this.classroomService
      .GetClassroomById(ID)
      .subscribe((allData: any) => {

        const record =
          allData?.data?.dataList?.[0];

        if (!record) {
          return;
        }

        this.classroomObj = {
          ...record
        };

        this.isEditClassroom = true;

        this.selectedClassroomId =
          record.id;

        this.statusValue =
          record.status?.name ||
          record.status?.id ||
          '';

        this.classroomObj.status =
          record.status?.id ??
          record.status ??
          null;
      });
  }

  SelectClassroomRow(
    classroom: any
  ): void {

    this.selectedClassroomId =
      classroom.id;

    this.GetClassroomById(
      classroom.id
    );
  }

  GetAllClassrooms(): void {

    this.classroomService
      .GetAllClassrooms()
      .subscribe((allData: any) => {

        this.classrooms =
          allData?.data?.dataList ||
          [];
      });
  }

  DeleteById(
    ID: any
  ): void {

    swal({
      title: 'Are you sure?',
      text: 'That you want to delete this classroom?',
      icon: 'warning',
      dangerMode: true,
    }).then((willDelete) => {

      if (willDelete) {

        this.classroomService
          .DeleteClassroomById(ID)
          .subscribe({

            next: (result: any): void => {

              this.GetAllClassrooms();

              if (
                String(this.selectedClassroomId) ===
                String(ID)
              ) {
                this.ClearForm();
              }

              swal(
                'Deleted!',
                'Classroom has been deleted!',
                'success'
              );
            },

            error: (error: any): void => {

              console.log(error);

              swal(
                'Error!',
                'Unable to delete classroom.',
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

  isClassroomActive(
    classroom: any
  ): boolean {

    return String(
      classroom.status?.name || ''
    ).toLowerCase() === 'active';
  }

  onStatusToggle(
    classroom: any,
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

      this.GetAllClassrooms();

      return;
    }

    classroom.status =
      selectedStatus;

    classroom.statusChanged =
      true;
  }

  saveClassroomStatus(
    classroom: any
  ): void {

    const classroomToUpdate:
      ClassroomRepresentation = {
        ...classroom,
        status: classroom.status?.id
      };

    this.classroomService
      .createClassroom(
        classroomToUpdate,
        'Update'
      )
      .subscribe({

        next: (result: any): void => {

          classroom.statusChanged =
            false;

          swal(
            'Successful!',
            'Classroom status has been updated!',
            'success'
          );

          this.GetAllClassrooms();
        },

        error: (error: any): void => {

          console.log(error);

          swal(
            'Error!',
            'Unable to update classroom status.',
            'error'
          );

          this.GetAllClassrooms();
        }

      });
  }

  get filteredClassrooms(): any[] {

    if (!this.classrooms) {
      return [];
    }

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      return this.classrooms;
    }

    return this.classrooms.filter(
      (classroom: any) => {

        const roomCode =
          String(
            classroom.roomCode ||
            classroom.id ||
            ''
          ).toLowerCase();

        const roomName =
          String(
            classroom.roomName ||
            ''
          ).toLowerCase();

        const ageGroup =
          String(
            classroom.ageGroup ||
            ''
          ).toLowerCase();

        const floor =
          String(
            classroom.floor ||
            ''
          ).toLowerCase();

        return (
          roomCode.includes(search) ||
          roomName.includes(search) ||
          ageGroup.includes(search) ||
          floor.includes(search)
        );
      }
    );
  }

  ClearForm(): void {

    this.classroomObj = {};

    this.statusValue = '';

    this.isEditClassroom = false;

    this.type = '';

    this.selectedClassroomId = null;
  }
}