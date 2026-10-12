import { Component } from '@angular/core';
import { ProgramRepresentation } from '../services/api/module/program-representation';
import { ProgramService } from '../services/api/program/program.service';
import { StatusService } from '../services/api/status/status.service';
import swal from 'sweetalert';

@Component({
  selector: 'app-program',
  standalone: false,
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.scss'],
})
export class ProgramComponent {

  programObj: ProgramRepresentation = {};

  programs: Array<any> = [];

  allStatus: Array<any> = [];

  type: string = '';

  isEditProgram: boolean = false;

  canCreate: boolean = true;
  canUpdate: boolean = true;
  canDelete: boolean = true;

  searchText: string = '';

  selectedProgramId: any = null;

  constructor(
    private programService: ProgramService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    this.isEditProgram = false;

    this.canCreate = true;
    this.canUpdate = true;
    this.canDelete = true;

    this.GetAllStatus();
    this.GetAllPrograms();
  }

  SaveProgram(): void {

    this.type = this.isEditProgram
      ? 'Update'
      : 'Add';

    if (
      this.type === 'Add' &&
      (
        this.programObj.status === null ||
        this.programObj.status === undefined ||
        this.programObj.status === ''
      )
    ) {

      const activeStatus =
        this.allStatus.find(
          (status: any) =>
            String(status.name).toLowerCase() === 'active'
        );

      if (!activeStatus) {
        swal(
          'Error!',
          'Active status was not found. Please check your status records.',
          'error'
        );
        return;
      }

      this.programObj.status = activeStatus.id;
    }

    if (this.type === 'Add') {

      swal({
        title: 'Register Program?',
        text: 'Do you want to register this program?',
        icon: 'warning',
        dangerMode: true,
      }).then((confirmed) => {

        if (!confirmed) {
          return;
        }

        this.programService
          .createProgram(this.programObj, 'Add')
          .subscribe({

            next: (result: any): void => {

              this.GetAllPrograms();
              this.ClearForm();

              swal(
                'Successful!',
                'Program has been registered!',
                'success'
              );
            },

            error: (error: any): void => {

              console.error(error);

              swal(
                'Error!',
                'Unable to register the program. Please check the required fields and API response.',
                'error'
              );
            }

          });
      });

    } else {

      this.programService
        .createProgram(this.programObj, 'Update')
        .subscribe({

          next: (result: any): void => {

            this.GetAllPrograms();
            this.ClearForm();

            swal(
              'Successful!',
              'Program has been updated!',
              'success'
            );
          },

          error: (error: any): void => {

            console.error(error);

            swal(
              'Error!',
              'Unable to update the program.',
              'error'
            );
          }

        });
    }
  }

  GetProgramById(ID: any): void {

    this.programService
      .GetProgramById(ID)
      .subscribe((allData: any) => {

        const record =
          allData?.data?.dataList?.[0];

        if (!record) {
          swal(
            'Not Found',
            'The selected program could not be found.',
            'warning'
          );
          return;
        }

        this.programObj = {
          ...record,

          sessionStart:
            record.sessionStart
              ? String(record.sessionStart).slice(0, 5)
              : '',

          sessionEnd:
            record.sessionEnd
              ? String(record.sessionEnd).slice(0, 5)
              : '',

          monthlyFee:
            record.monthlyFee ?? null,

          status:
            record.status?.id ??
            record.status ??
            null
        };

        this.isEditProgram = true;
        this.selectedProgramId = record.id;
      });
  }

  SelectProgramRow(program: any): void {
    this.selectedProgramId = program.id;
    this.GetProgramById(program.id);
  }

  GetAllPrograms(): void {

    this.programService
      .GetAllPrograms()
      .subscribe({

        next: (allData: any): void => {
          this.programs =
            allData?.data?.dataList || [];
        },

        error: (error: any): void => {
          console.error(error);

          swal(
            'Error!',
            'Unable to load registered programs.',
            'error'
          );
        }

      });
  }

  DeleteById(ID: any): void {

    swal({
      title: 'Are you sure?',
      text: 'Do you want to delete this program?',
      icon: 'warning',
      dangerMode: true,
    }).then((confirmed) => {

      if (!confirmed) {
        return;
      }

      this.programService
        .DeleteProgramById(ID)
        .subscribe({

          next: (result: any): void => {

            if (
              String(this.selectedProgramId) ===
              String(ID)
            ) {
              this.ClearForm();
            }

            this.GetAllPrograms();

            swal(
              'Deleted!',
              'Program has been deleted!',
              'success'
            );
          },

          error: (error: any): void => {

            console.error(error);

            swal(
              'Error!',
              'Unable to delete the program. It may be linked to other records.',
              'error'
            );
          }

        });
    });
  }

  GetAllStatus(): void {

    this.statusService
      .GetAllStatus()
      .subscribe({

        next: (allData: any): void => {
          this.allStatus =
            allData?.data?.dataList || [];
        },

        error: (error: any): void => {
          console.error(error);
        }

      });
  }

  isProgramActive(program: any): boolean {
    return String(
      program.status?.name || ''
    ).toLowerCase() === 'active';
  }

  onStatusToggle(
    program: any,
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
          String(status.name).toLowerCase() ===
          newStatusName.toLowerCase()
      );

    if (!selectedStatus) {

      swal(
        'Error!',
        `${newStatusName} status was not found.`,
        'error'
      );

      this.GetAllPrograms();
      return;
    }

    program.status = selectedStatus;
    program.statusChanged = true;
  }

  saveProgramStatus(program: any): void {

    const programToUpdate: ProgramRepresentation = {
      ...program,
      status: program.status?.id
    };

    this.programService
      .createProgram(programToUpdate, 'Update')
      .subscribe({

        next: (result: any): void => {

          program.statusChanged = false;

          swal(
            'Successful!',
            'Program status has been updated!',
            'success'
          );

          this.GetAllPrograms();
        },

        error: (error: any): void => {

          console.error(error);

          swal(
            'Error!',
            'Unable to update program status.',
            'error'
          );

          this.GetAllPrograms();
        }

      });
  }

  formatTime(time: any): string {

    if (!time) {
      return '-';
    }

    return String(time).slice(0, 5);
  }

  get filteredPrograms(): any[] {

    if (!this.programs) {
      return [];
    }

    const search =
      this.searchText.trim().toLowerCase();

    if (!search) {
      return this.programs;
    }

    return this.programs.filter(
      (program: any) => {

        const code =
          String(
            program.programCode ||
            program.id ||
            ''
          ).toLowerCase();

        const name =
          String(program.programName || '')
            .toLowerCase();

        const description =
          String(program.description || '')
            .toLowerCase();

        return (
          code.includes(search) ||
          name.includes(search) ||
          description.includes(search)
        );
      }
    );
  }

  ClearForm(): void {
    this.programObj = {};
    this.isEditProgram = false;
    this.type = '';
    this.selectedProgramId = null;
  }
}