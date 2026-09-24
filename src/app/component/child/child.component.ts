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
  allParents: any;
  allStatus: any;

  type: string;
  parentValue: any;
  statusValue: any;
  isEditChild: boolean = false;
  dtDynamicVerticalScrollExample: any;

  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private childService: ChildService,
    private statusService: StatusService,
    private permissionHelper: PermissionHelperService,
    public fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isEditChild = false;
    this.canCreate = this.permissionHelper.has(AuthIds.CHILD_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.CHILD_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.CHILD_DELETE);
    this.GetAllParents();
    this.GetAllStatus();
    this.GetAllChildren();
  }

  SaveChild(): void {
    this.type = this.isEditChild == false ? 'Add' : 'Update';

    if (this.type == 'Add') {
      swal({
        title: 'Are you sure?',
        text: 'That you want to Add this details?',
        icon: 'warning',
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          this.childService.createChild(this.childObj, this.type).subscribe({
            next: (result): void => {
              this.GetAllChildren();
            },
          });

          swal('Sucessfull!', 'Child has been Adedd!', 'success');
        }
      });
    } else {
      console.log(this.childObj);

      this.childService.createChild(this.childObj, this.type).subscribe({
        next: (result): void => {
          this.GetAllChildren();
        },
      });

      swal('Sucessfull!', 'Child has been updated!', 'success');
    }
  }

  GetChildById(ID: any) {
    this.childService.GetChildById(ID).subscribe((allData) => {
      this.childObj = allData.data.dataList[0];
      this.isEditChild = true;
      this.parentValue = allData.data.dataList[0].parent.fullName;
      this.childObj.parent = allData.data.dataList[0].parent.id;
      this.statusValue = allData.data.dataList[0].status.name;
      this.childObj.status = allData.data.dataList[0].status.id;
    });
  }

  GetAllChildren() {
    this.childService.GetAllChildren().subscribe((allData) => {
      this.children = allData?.data?.dataList || [];
    });
  }

  DeleteById(ID: any) {
    swal({
      title: 'Are you sure',
      text: 'That you want to Delete this Child?',
      icon: 'warning',
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        swal('Deleted!', 'Child has been deleted!', 'success');

        this.childService.DeleteChildById(ID).subscribe((allData) => {
          this.GetAllChildren();
        });
      }
    });
  }

  GetAllParents() {
    this.childService.GetAllParents().subscribe((allData) => {
      this.allParents = allData.data.dataList;
    });
  }

  GetAllStatus() {
    this.statusService.GetAllStatus().subscribe((allData) => {
      this.allStatus = allData.data.dataList;
    });
  }

  onChangeParent(E: any) {
    this.childObj.parent = E.target.value;
  }

  onChangeStatus(E: any) {
    this.childObj.status = E.target.value;
  }
}
