import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {
  CommonDataItem,
  PrivilegeGroup,
  PrivilegeService,
  SystemPrivilegeList
} from '../services/api/privilege/privilege.service';
import { UserAuthService } from '../services/api/user/user-auth.service';
import { UserService } from '../services/api/user/user.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-privilege',
  templateUrl: './privilege.component.html',
  styleUrls: ['./privilege.component.scss']
})
export class PrivilegeComponent implements OnInit {
  @ViewChild('groupModal') groupModal!: TemplateRef<any>;
  @ViewChild('confirmModal') confirmModal!: TemplateRef<any>;

  groups: PrivilegeGroup[] = [];
  selectedGroupId: number | null = null;
  groupForm: PrivilegeGroup = { groupName: '', groupDescription: '' };

  availablePrivileges: CommonDataItem[] = [];
  assignedPrivileges: CommonDataItem[] = [];
  private originalPrivilegeIds = new Set<number>();

  availableUsers: CommonDataItem[] = [];
  assignedUsers: CommonDataItem[] = [];
  private originalUserIds = new Set<number>();

  systemPrivileges: SystemPrivilegeList | null = null;
  myAuthIds: number[] = [];
  myUserId: number | null = null;

  private modalRef?: NgbModalRef;
  private pendingDeleteId: number | null = null;

  constructor(
    private privilegeService: PrivilegeService,
    private userAuthService: UserAuthService,
    private userService: UserService,
    private modalService: NgbModal,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.myUserId = this.userAuthService.getUserId();
    this.loadGroups();
    this.loadSystemPrivileges();

    if (this.myUserId) {
      this.userService.getAuthIds(this.myUserId).subscribe({
        next: (ids) => this.myAuthIds = ids,
        error: () => this.myAuthIds = []
      });
    }
  }

  loadGroups(): void {
    this.privilegeService.getPrivilegeGroups().subscribe({
      next: (groups) => this.groups = groups,
      error: () => this.toast.error('Failed to load privilege groups')
    });
  }

  loadSystemPrivileges(): void {
    this.privilegeService.getSystemPrivileges().subscribe({
      next: (data) => this.systemPrivileges = data
    });
  }

  openCreateGroupModal(): void {
    this.groupForm = { groupName: '', groupDescription: '' };
    this.modalRef = this.modalService.open(this.groupModal, {
      centered: true,
      backdrop: 'static'
    });
  }

  createGroup(): void {
    if (!this.groupForm.groupName?.trim()) {
      this.toast.error('Group name is required');
      return;
    }
    this.privilegeService.createPrivilegeGroup(this.groupForm).subscribe({
      next: () => {
        this.toast.success('Privilege group created');
        this.modalRef?.close();
        this.loadGroups();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to create group')
    });
  }

  askDeleteGroup(id: number): void {
    this.pendingDeleteId = id;
    this.modalRef = this.modalService.open(this.confirmModal, { centered: true });
  }

  confirmDelete(): void {
    if (this.pendingDeleteId == null) {
      return;
    }
    const id = this.pendingDeleteId;
    this.privilegeService.deletePrivilegeGroup(id).subscribe({
      next: () => {
        this.toast.success('Privilege group removed');
        this.modalRef?.close();
        if (this.selectedGroupId === id) {
          this.selectedGroupId = null;
          this.onGroupChange();
        }
        this.loadGroups();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete group')
    });
  }

  onGroupChange(): void {
    if (!this.selectedGroupId) {
      this.availablePrivileges = [];
      this.assignedPrivileges = [];
      this.availableUsers = [];
      this.assignedUsers = [];
      return;
    }

    this.privilegeService.getAvailablePrivileges(this.selectedGroupId).subscribe({
      next: (data) => this.availablePrivileges = data,
      error: () => this.toast.error('Failed to load available privileges')
    });
    this.privilegeService.getAssignedPrivileges(this.selectedGroupId).subscribe({
      next: (data) => {
        this.assignedPrivileges = data;
        this.originalPrivilegeIds = new Set(data.map(d => d.id));
      },
      error: () => this.toast.error('Failed to load assigned privileges')
    });

    this.privilegeService.getAvailableUsers(this.selectedGroupId).subscribe({
      next: (data) => this.availableUsers = data,
      error: () => this.toast.error('Failed to load available users')
    });
    this.privilegeService.getAssignedUsers(this.selectedGroupId).subscribe({
      next: (data) => {
        this.assignedUsers = data;
        this.originalUserIds = new Set(data.map(d => d.id));
      },
      error: () => this.toast.error('Failed to load assigned users')
    });
  }

  assignPrivilege(item: CommonDataItem): void {
    this.availablePrivileges = this.availablePrivileges.filter(a => a.id !== item.id);
    this.assignedPrivileges = [...this.assignedPrivileges, item];
  }

  unassignPrivilege(item: CommonDataItem): void {
    this.assignedPrivileges = this.assignedPrivileges.filter(a => a.id !== item.id);
    this.availablePrivileges = [...this.availablePrivileges, item];
  }

  savePrivileges(): void {
    if (!this.selectedGroupId) {
      return;
    }
    const current = new Set(this.assignedPrivileges.map(a => a.id));
    const addedData = this.assignedPrivileges.filter(a => !this.originalPrivilegeIds.has(a.id));
    const removedData = [...this.originalPrivilegeIds]
      .filter(id => !current.has(id))
      .map(id => ({ id, description: '' }));

    this.privilegeService.saveGroupPrivileges(this.selectedGroupId, { addedData, removedData }).subscribe({
      next: () => {
        this.toast.success('Group privileges saved');
        this.onGroupChange();
      },
      error: () => this.toast.error('Failed to save privileges')
    });
  }

  assignUser(item: CommonDataItem): void {
    this.availableUsers = this.availableUsers.filter(a => a.id !== item.id);
    this.assignedUsers = [...this.assignedUsers, item];
  }

  unassignUser(item: CommonDataItem): void {
    this.assignedUsers = this.assignedUsers.filter(a => a.id !== item.id);
    this.availableUsers = [...this.availableUsers, item];
  }

  saveUsers(): void {
    if (!this.selectedGroupId) {
      return;
    }
    const current = new Set(this.assignedUsers.map(a => a.id));
    const addedData = this.assignedUsers.filter(a => !this.originalUserIds.has(a.id));
    const removedData = [...this.originalUserIds]
      .filter(id => !current.has(id))
      .map(id => ({ id, description: '' }));

    this.privilegeService.saveGroupUsers(this.selectedGroupId, { addedData, removedData }).subscribe({
      next: () => {
        this.toast.success('Group users saved');
        this.onGroupChange();
      },
      error: () => this.toast.error('Failed to save users')
    });
  }
}
