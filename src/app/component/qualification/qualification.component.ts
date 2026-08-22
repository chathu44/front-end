import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QualificationService } from '../services/api/qualification/qualification.service';
import { QualificationRepresentation } from '../services/api/module/qualification-representation';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-qualification',
  templateUrl: './qualification.component.html',
  styleUrls: ['./qualification.component.scss']
})
export class QualificationComponent implements OnInit {
  @ViewChild('qualificationFormModal') qualificationFormModal!: TemplateRef<any>;

  qualifications: any[] = [];
  qualificationObj: QualificationRepresentation = {};
  isEdit = false;
  searchText = '';
  private modalRef?: NgbModalRef;

  constructor(
    private qualificationService: QualificationService,
    private modalService: NgbModal,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadQualifications();
  }

  get filteredQualifications(): any[] {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      return this.qualifications;
    }
    return this.qualifications.filter(item =>
      String(item.qualificationName || '').toLowerCase().includes(q) ||
      String(item.id || '').toLowerCase().includes(q)
    );
  }

  loadQualifications(): void {
    this.qualificationService.GetAllQualification().subscribe({
      next: (res) => this.qualifications = res?.data?.dataList || [],
      error: () => this.toast.error('Failed to load qualifications')
    });
  }

  openAddModal(): void {
    this.isEdit = false;
    this.qualificationObj = { qualificationName: '' };
    this.modalRef = this.modalService.open(this.qualificationFormModal, {
      centered: true,
      backdrop: 'static'
    });
  }

  openEditModal(row: any): void {
    this.isEdit = true;
    this.qualificationObj = {
      id: row.id,
      qualificationName: row.qualificationName
    };
    this.modalRef = this.modalService.open(this.qualificationFormModal, {
      centered: true,
      backdrop: 'static'
    });
  }

  save(): void {
    const name = (this.qualificationObj.qualificationName || '').trim();
    if (!name) {
      this.toast.error('Qualification name is required');
      return;
    }

    const type = this.isEdit ? 'Update' : 'Add';
    const payload = {
      id: this.qualificationObj.id,
      qualificationName: name
    };

    this.qualificationService.createQualification(payload, type).subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Qualification updated' : 'Qualification added');
        this.modalRef?.close();
        this.loadQualifications();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to save qualification')
    });
  }

  deleteById(id: number | string): void {
    this.qualificationService.DeleteQualificationById(id).subscribe({
      next: () => {
        this.toast.success('Qualification deleted');
        this.loadQualifications();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete qualification')
    });
  }
}
