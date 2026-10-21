import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';
import { MealPlanRepresentation } from '../services/api/module/meal-plan-representation';
import { MealRecordRepresentation } from '../services/api/module/meal-record-representation';
import { MealPlanService } from '../services/api/meal-plan/meal-plan.service';
import { MealRecordService } from '../services/api/meal-record/meal-record.service';
import { AuthIds, PermissionHelperService } from '../services/permission-helper.service';
import { UserAuthService } from '../services/api/user/user-auth.service';

type MealTab = 'plans' | 'records';

@Component({
  selector: 'app-meal-plan',
  standalone: false,
  templateUrl: './meal-plan.component.html',
  styleUrls: ['./meal-plan.component.scss'],
})
export class MealPlanComponent implements OnInit {
  activeTab: MealTab = 'plans';
  searchText = '';

  mealPlanObj: MealPlanRepresentation = this.newMealPlan();
  mealPlans: any[] = [];
  allClassroomList: any[] = [];
  selectedClassroomId = '';
  isEditMealPlan = false;
  loadingPlans = false;
  savingPlan = false;

  mealRecordObj: MealRecordRepresentation = this.newMealRecord();
  mealRecords: any[] = [];
  allChildList: any[] = [];
  allMealPlanList: any[] = [];
  selectedChildId = '';
  selectedMealPlanId = '';
  ateMealValue = '';
  isEditMealRecord = false;
  loadingRecords = false;
  savingRecord = false;

  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private mealPlanService: MealPlanService,
    private mealRecordService: MealRecordService,
    private permissionHelper: PermissionHelperService,
    private userAuthService: UserAuthService
  ) {}

ngOnInit(): void {
  console.log(
    'Permissions received from login:',
    this.userAuthService.getAuthIds()
  );

  this.canView = this.permissionHelper.has(AuthIds.MEAL_VIEW);
  this.canCreate = this.permissionHelper.has(AuthIds.MEAL_CREATE);
  this.canUpdate = this.permissionHelper.has(AuthIds.MEAL_UPDATE);
  this.canDelete = this.permissionHelper.has(AuthIds.MEAL_DELETE);

  console.log('Meal permissions:', {
    view: this.canView,
    create: this.canCreate,
    update: this.canUpdate,
    delete: this.canDelete
  });

  this.loadClassrooms();
  this.loadChildren();
  this.loadMealPlans();
  this.loadMealRecords();
}

  // ngOnInit(): void {
  //   this.canView = this.permissionHelper.has(AuthIds.MEAL_VIEW);
  //   this.canCreate = this.permissionHelper.has(AuthIds.MEAL_CREATE);
  //   this.canUpdate = this.permissionHelper.has(AuthIds.MEAL_UPDATE);
  //   this.canDelete = this.permissionHelper.has(AuthIds.MEAL_DELETE);

  //   this.loadClassrooms();
  //   this.loadChildren();
  //   this.loadMealPlans();
  //   this.loadMealRecords();

  // }

  setTab(tab: MealTab): void {
    this.activeTab = tab;
    this.searchText = '';
  }

  get filteredMealPlans(): any[] {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return this.mealPlans;
    return this.mealPlans.filter((plan) =>
      [plan.id, plan.mealDate, plan.mealType, plan.menuItems, plan.classroom?.roomName]
        .some((value) => String(value ?? '').toLowerCase().includes(term)),
    );
  }

  get filteredMealRecords(): any[] {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return this.mealRecords;
    return this.mealRecords.filter((record) => {
      const child = this.childName(record.child);
      const plan = this.mealPlanLabel(record.mealPlan);
      const ate = record.ateMeal == null ? 'not recorded' : record.ateMeal ? 'yes ate' : 'no did not eat';
      return [record.id, record.mealDate, record.mealType, record.notes, child, plan, ate]
        .some((value) => String(value ?? '').toLowerCase().includes(term));
    });
  }

  // ---------------- Meal Plans ----------------
  saveMealPlan(): void {
    if (!this.mealPlanObj.mealDate || !this.mealPlanObj.menuItems?.trim()) {
      swal('Required fields', 'Please enter a meal date and menu items.', 'warning');
      return;
    }
    if ((this.isEditMealPlan && !this.canUpdate) || (!this.isEditMealPlan && !this.canCreate)) {
      swal('Permission denied', 'You do not have permission to save meal plans.', 'warning');
      return;
    }
    if (this.savingPlan) return;

    const mode: 'Add' | 'Update' = this.isEditMealPlan ? 'Update' : 'Add';
    const payload: MealPlanRepresentation = {
      ...this.mealPlanObj,
      mealDate: this.mealPlanObj.mealDate || '',
      mealType: this.mealPlanObj.mealType || 'Breakfast',
      menuItems: this.mealPlanObj.menuItems.trim(),
      classroom: this.selectedClassroomId || null,
    };

    this.savingPlan = true;
    this.mealPlanService.createMealPlan(payload, mode).subscribe({
      next: () => {
        this.savingPlan = false;
        swal('Success', mode === 'Add' ? 'Meal plan added successfully.' : 'Meal plan updated successfully.', 'success');
        this.resetMealPlanForm();
        this.loadMealPlans();
      },
      error: (error) => {
        this.savingPlan = false;
        swal('Unable to save meal plan', this.errorMessage(error), 'error');
      },
    });
  }

  editMealPlan(plan: any): void {
    this.mealPlanObj = {
      ...plan,
      mealDate: String(plan?.mealDate ?? '').slice(0, 10),
    };
    this.selectedClassroomId = plan?.classroom?.id == null ? '' : String(plan.classroom.id);
    this.isEditMealPlan = true;
    this.activeTab = 'plans';
    this.scrollToForm();
  }

  deleteMealPlan(id: string | number): void {
    if (!this.canDelete) {
      swal('Permission denied', 'You do not have permission to delete meal plans.', 'warning');
      return;
    }
    if (!window.confirm('Delete this meal plan? This action cannot be undone.')) return;

    this.mealPlanService.DeleteMealPlanById(id).subscribe({
      next: () => {
        swal('Deleted', 'Meal plan deleted successfully.', 'success');
        if (String(this.mealPlanObj.id ?? '') === String(id)) this.resetMealPlanForm();
        this.loadMealPlans();
        this.loadMealRecords();
      },
      error: (error) => swal('Unable to delete meal plan', this.errorMessage(error), 'error'),
    });
  }

  resetMealPlanForm(): void {
    this.mealPlanObj = this.newMealPlan();
    this.selectedClassroomId = '';
    this.isEditMealPlan = false;
  }

  // ---------------- Meal Records ----------------
  saveMealRecord(): void {
    if (!this.mealRecordObj.mealDate || !this.selectedChildId || !this.selectedMealPlanId) {
      swal('Required fields', 'Please select a meal date, child, and meal plan.', 'warning');
      return;
    }
    if ((this.isEditMealRecord && !this.canUpdate) || (!this.isEditMealRecord && !this.canCreate)) {
      swal('Permission denied', 'You do not have permission to save meal records.', 'warning');
      return;
    }
    if (this.savingRecord) return;

    const mode: 'Add' | 'Update' = this.isEditMealRecord ? 'Update' : 'Add';
    const payload: MealRecordRepresentation = {
      ...this.mealRecordObj,
      mealDate: this.mealRecordObj.mealDate || '',
      mealType: this.mealRecordObj.mealType || 'Lunch',
      notes: this.mealRecordObj.notes?.trim() || '',
      child: this.selectedChildId,
      mealPlan: this.selectedMealPlanId,
      ateMeal: this.ateMealValue === '' ? null : this.ateMealValue === 'true',
    };

    this.savingRecord = true;
    this.mealRecordService.createMealRecord(payload, mode).subscribe({
      next: () => {
        this.savingRecord = false;
        swal('Success', mode === 'Add' ? 'Meal record added successfully.' : 'Meal record updated successfully.', 'success');
        this.resetMealRecordForm();
        this.loadMealRecords();
      },
      error: (error) => {
        this.savingRecord = false;
        swal('Unable to save meal record', this.errorMessage(error), 'error');
      },
    });
  }

  editMealRecord(record: any): void {
    this.mealRecordObj = {
      ...record,
      mealDate: String(record?.mealDate ?? '').slice(0, 10),
    };
    this.selectedChildId = record?.child?.id == null ? String(record?.child ?? '') : String(record.child.id);
    this.selectedMealPlanId = record?.mealPlan?.id == null ? String(record?.mealPlan ?? '') : String(record.mealPlan.id);
    this.ateMealValue = record?.ateMeal == null ? '' : record.ateMeal ? 'true' : 'false';
    this.isEditMealRecord = true;
    this.activeTab = 'records';
    this.scrollToForm();
  }

  deleteMealRecord(id: string | number): void {
    if (!this.canDelete) {
      swal('Permission denied', 'You do not have permission to delete meal records.', 'warning');
      return;
    }
    if (!window.confirm('Delete this meal record? This action cannot be undone.')) return;

    this.mealRecordService.DeleteMealRecordById(id).subscribe({
      next: () => {
        swal('Deleted', 'Meal record deleted successfully.', 'success');
        if (String(this.mealRecordObj.id ?? '') === String(id)) this.resetMealRecordForm();
        this.loadMealRecords();
      },
      error: (error) => swal('Unable to delete meal record', this.errorMessage(error), 'error'),
    });
  }

  resetMealRecordForm(): void {
    this.mealRecordObj = this.newMealRecord();
    this.selectedChildId = '';
    this.selectedMealPlanId = '';
    this.ateMealValue = '';
    this.isEditMealRecord = false;
  }

  childName(child: any): string {
    const name = `${child?.firstName ?? ''} ${child?.lastName ?? ''}`.trim();
    return name || child?.childCode || `Child ${child?.id ?? ''}`;
  }

  mealPlanLabel(plan: any): string {
    const date = plan?.mealDate ? String(plan.mealDate).slice(0, 10) : 'No date';
    const type = plan?.mealType || 'Meal';
    const menu = plan?.menuItems ? ` — ${plan.menuItems}` : '';
    return `${date} · ${type}${menu}`;
  }

  // ---------------- Data loading ----------------
  private loadClassrooms(): void {
    this.mealPlanService.GetAllClassroomList().subscribe({
      next: (response) => this.allClassroomList = this.extractList(response),
      error: (error) => {
        this.allClassroomList = [];
        swal('Unable to load classrooms', this.errorMessage(error), 'error');
      },
    });
  }

  private loadChildren(): void {
    this.mealRecordService.GetAllChildList().subscribe({
      next: (response) => this.allChildList = this.extractList(response),
      error: (error) => {
        this.allChildList = [];
        swal('Unable to load children', this.errorMessage(error), 'error');
      },
    });
  }

  loadMealPlans(): void {
    this.loadingPlans = true;
    this.mealPlanService.GetAllMealPlans().subscribe({
      next: (response) => {
        this.mealPlans = this.extractList(response);
        this.allMealPlanList = this.mealPlans;
        this.loadingPlans = false;
      },
      error: (error) => {
        this.loadingPlans = false;
        this.mealPlans = [];
        this.allMealPlanList = [];
        swal('Unable to load meal plans', this.errorMessage(error), 'error');
      },
    });
  }

  loadMealRecords(): void {
    this.loadingRecords = true;
    this.mealRecordService.GetAllMealRecords().subscribe({
      next: (response) => {
        this.mealRecords = this.extractList(response);
        this.loadingRecords = false;
      },
      error: (error) => {
        this.loadingRecords = false;
        this.mealRecords = [];
        swal('Unable to load meal records', this.errorMessage(error), 'error');
      },
    });
  }

  private newMealPlan(): MealPlanRepresentation {
    return { mealDate: '', mealType: 'Breakfast', menuItems: '', classroom: null };
  }

  private newMealRecord(): MealRecordRepresentation {
    return { mealDate: '', mealType: 'Lunch', ateMeal: null, notes: '', child: null, mealPlan: null };
  }

  private extractList(response: any): any[] {
    const candidates = [
      response?.data?.dataList,
      response?.dataList,
      response?.data?.content,
      response?.content,
      response?.data,
      response,
    ];
    const value = candidates.find((candidate) => Array.isArray(candidate));
    return value ?? [];
  }

  private errorMessage(error: any): string {
    const message = error?.error?.message || error?.error?.error || error?.error?.detail || error?.message;
    if (error?.status === 0) return 'Cannot connect to Spring Boot. Check that the backend is running at http://localhost:8010.';
    return message || `Request failed${error?.status ? ` (HTTP ${error.status})` : ''}. Check the browser Console and Network tabs for details.`;
  }

  private scrollToForm(): void {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }
}
