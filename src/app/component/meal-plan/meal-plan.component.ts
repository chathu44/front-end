import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';
import { MealPlanRepresentation } from '../services/api/module/meal-plan-representation';
import { MealRecordRepresentation } from '../services/api/module/meal-record-representation';
import { MealPlanService } from '../services/api/meal-plan/meal-plan.service';
import { MealRecordService } from '../services/api/meal-record/meal-record.service';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';
import { UserAuthService } from '../services/api/user/user-auth.service';

type MealTab = 'plans' | 'records';

import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  filterStatusOptions,
  findStatusById,
  normalizeLookupName,
  unwrapApiList,
  scrollPageToTop,
} from '../services/lookup-utils';

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
  allClassroomList$: Observable<any[]> = of([]);
  selectedClassroomId = '';
  isEditMealPlan = false;
  isReadOnlyMealPlan = false;
  loadingPlans = false;
  savingPlan = false;

  mealRecordObj: MealRecordRepresentation = this.newMealRecord();
  mealRecords: any[] = [];
  allChildList: any[] = [];
  allChildList$: Observable<any[]> = of([]);
  allMealPlanList: any[] = [];
  allMealPlanList$: Observable<any[]> = of([]);
  selectedChildId = '';
  selectedMealPlanId = '';
  ateMealValue = '';
  isEditMealRecord = false;
  isReadOnlyMealRecord = false;
  loadingRecords = false;
  savingRecord = false;

  readonly mealTypeOptions = [
    'Breakfast',
    'Morning Snack',
    'Lunch',
    'Afternoon Snack',
    'Dinner',
    'Other',
  ];
  readonly ateMealOptions = [
    { value: '', label: 'Not recorded' },
    { value: 'true', label: 'Yes, ate the meal' },
    { value: 'false', label: 'No, did not eat' },
  ];

  canView = false;
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  constructor(
    private mealPlanService: MealPlanService,
    private mealRecordService: MealRecordService,
    private permissionHelper: PermissionHelperService,
    private userAuthService: UserAuthService,
  ) {}

  ngOnInit(): void {
    console.log(
      'Permissions received from login:',
      this.userAuthService.getAuthIds(),
    );

    this.canView = this.permissionHelper.has(AuthIds.MEAL_VIEW);
    this.canCreate = this.permissionHelper.has(AuthIds.MEAL_CREATE);
    this.canUpdate = this.permissionHelper.has(AuthIds.MEAL_UPDATE);
    this.canDelete = this.permissionHelper.has(AuthIds.MEAL_DELETE);

    console.log('Meal permissions:', {
      view: this.canView,
      create: this.canCreate,
      update: this.canUpdate,
      delete: this.canDelete,
    });

    this.loadClassrooms();
    this.loadChildren();
    this.loadMealPlans();
    this.loadMealRecords();
  }

  setTab(tab: MealTab): void {
    this.activeTab = tab;
    this.searchText = '';
  }

  get filteredMealPlans(): any[] {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return this.mealPlans;
    return this.mealPlans.filter((plan) =>
      [
        plan.id,
        plan.mealDate,
        plan.mealType,
        plan.menuItems,
        plan.classroom?.roomName,
      ].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(term),
      ),
    );
  }

  get filteredMealRecords(): any[] {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return this.mealRecords;
    return this.mealRecords.filter((record) => {
      const child = this.childName(record.child);
      const plan = this.mealPlanLabel(record.mealPlan);
      const ate =
        record.ateMeal == null
          ? 'not recorded'
          : record.ateMeal
            ? 'yes ate'
            : 'no did not eat';
      return [
        record.id,
        record.mealDate,
        record.mealType,
        record.notes,
        child,
        plan,
        ate,
      ].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(term),
      );
    });
  }

  saveMealPlan(): void {
    if (this.isReadOnlyMealPlan) return;

    const menuItems = String(this.mealPlanObj.menuItems ?? '').trim();
    if (
      !this.mealPlanObj.mealDate ||
      !this.mealPlanObj.mealType ||
      menuItems.length < 2
    ) {
      swal(
        'Required fields',
        'Choose a meal date and type, and enter at least 2 characters for menu items.',
        'warning',
      );
      return;
    }
    if (menuItems.length > 255) {
      swal(
        'Validation error',
        'Menu items cannot exceed 255 characters, matching the backend menu_items column.',
        'warning',
      );
      return;
    }
    if (
      (this.isEditMealPlan && !this.canUpdate) ||
      (!this.isEditMealPlan && !this.canCreate)
    ) {
      swal(
        'Permission denied',
        'You do not have permission to save meal plans.',
        'warning',
      );
      return;
    }
    if (this.savingPlan) return;

    const mode: 'Add' | 'Update' = this.isEditMealPlan ? 'Update' : 'Add';
    const payload: MealPlanRepresentation = {
      ...this.mealPlanObj,
      mealDate: this.mealPlanObj.mealDate || '',
      mealType: this.mealPlanObj.mealType || 'Breakfast',
      menuItems,
      classroom: this.selectedClassroomId || null,
    };

    this.savingPlan = true;
    this.mealPlanService.createMealPlan(payload, mode).subscribe({
      next: () => {
        this.savingPlan = false;
        swal(
          'Success',
          mode === 'Add'
            ? 'Meal plan added successfully.'
            : 'Meal plan updated successfully.',
          'success',
        );
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
    this.loadMealPlanSelection(plan, !this.canUpdate);
  }

  viewMealPlan(plan: any): void {
    this.loadMealPlanSelection(plan, true);
  }

  private loadMealPlanSelection(plan: any, readOnly: boolean): void {
    if (!plan) return;

    this.activeTab = 'plans';
    this.searchText = '';
    this.isEditMealPlan = true;
    this.isReadOnlyMealPlan = readOnly;

    const applyRecord = (record: any): void => {
      const selected = record ?? plan;
      this.mealPlanObj = {
        ...this.newMealPlan(),
        ...selected,
        mealDate: String(selected?.mealDate ?? '').slice(0, 10),
        classroom: selected?.classroom?.id ?? selected?.classroom ?? null,
      };
      this.selectedClassroomId =
        selected?.classroom?.id ?? selected?.classroom ?? '';
      this.isEditMealPlan = true;
      this.isReadOnlyMealPlan = readOnly;
      this.activeTab = 'plans';
      this.scrollToForm();
    };

    if (plan.id === null || plan.id === undefined) {
      applyRecord(plan);
      return;
    }

    this.mealPlanService.GetMealPlanById(plan.id).subscribe({
      next: (response: any) => applyRecord(this.extractOne(response) ?? plan),
      error: (error: any) => {
        console.error('Unable to load meal plan details:', error);
        applyRecord(plan);
      },
    });
  }

  deleteMealPlan(id: string | number): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete meal plans.',
        'warning',
      );
      return;
    }
    if (!window.confirm('Delete this meal plan? This action cannot be undone.'))
      return;

    this.mealPlanService.DeleteMealPlanById(id).subscribe({
      next: () => {
        swal('Deleted', 'Meal plan deleted successfully.', 'success');
        if (String(this.mealPlanObj.id ?? '') === String(id))
          this.resetMealPlanForm();
        this.loadMealPlans();
        this.loadMealRecords();
      },
      error: (error) =>
        swal('Unable to delete meal plan', this.errorMessage(error), 'error'),
    });
  }

  resetMealPlanForm(): void {
    this.mealPlanObj = this.newMealPlan();
    this.selectedClassroomId = '';
    this.isEditMealPlan = false;
    this.isReadOnlyMealPlan = false;
  }

  saveMealRecord(): void {
    if (this.isReadOnlyMealRecord) return;

    if (
      !this.mealRecordObj.mealDate ||
      !this.mealRecordObj.mealType ||
      !this.selectedChildId ||
      !this.selectedMealPlanId
    ) {
      swal(
        'Required fields',
        'Please select a meal date, meal type, child, and meal plan.',
        'warning',
      );
      return;
    }
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (String(this.mealRecordObj.mealDate ?? '') > todayDate) {
      swal(
        'Validation error',
        'A meal record cannot be recorded for a future date.',
        'warning',
      );
      return;
    }
    if (String(this.mealRecordObj.notes ?? '').trim().length > 255) {
      swal(
        'Validation error',
        'Meal notes cannot exceed 255 characters.',
        'warning',
      );
      return;
    }
    if (
      (this.isEditMealRecord && !this.canUpdate) ||
      (!this.isEditMealRecord && !this.canCreate)
    ) {
      swal(
        'Permission denied',
        'You do not have permission to save meal records.',
        'warning',
      );
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
        swal(
          'Success',
          mode === 'Add'
            ? 'Meal record added successfully.'
            : 'Meal record updated successfully.',
          'success',
        );
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
    this.loadMealRecordSelection(record, !this.canUpdate);
  }

  viewMealRecord(record: any): void {
    this.loadMealRecordSelection(record, true);
  }

  private loadMealRecordSelection(record: any, readOnly: boolean): void {
    if (!record) return;

    this.activeTab = 'records';
    this.searchText = '';
    this.isEditMealRecord = true;
    this.isReadOnlyMealRecord = readOnly;

    const applyRecord = (selectedRecord: any): void => {
      const selected = selectedRecord ?? record;
      this.mealRecordObj = {
        ...this.newMealRecord(),
        ...selected,
        mealDate: String(selected?.mealDate ?? '').slice(0, 10),
        child: selected?.child?.id ?? selected?.child ?? null,
        mealPlan: selected?.mealPlan?.id ?? selected?.mealPlan ?? null,
        ateMeal: selected?.ateMeal == null ? null : Boolean(selected.ateMeal),
      };
      this.selectedChildId = selected?.child?.id ?? selected?.child ?? '';
      this.selectedMealPlanId =
        selected?.mealPlan?.id ?? selected?.mealPlan ?? '';
      this.ateMealValue =
        selected?.ateMeal == null ? '' : selected.ateMeal ? 'true' : 'false';
      this.isEditMealRecord = true;
      this.isReadOnlyMealRecord = readOnly;
      this.activeTab = 'records';
      this.scrollToForm();
    };

    if (record.id === null || record.id === undefined) {
      applyRecord(record);
      return;
    }

    this.mealRecordService.GetMealRecordById(record.id).subscribe({
      next: (response: any) => applyRecord(this.extractOne(response) ?? record),
      error: (error: any) => {
        console.error('Unable to load meal record details:', error);
        applyRecord(record);
      },
    });
  }

  deleteMealRecord(id: string | number): void {
    if (!this.canDelete) {
      swal(
        'Permission denied',
        'You do not have permission to delete meal records.',
        'warning',
      );
      return;
    }
    if (
      !window.confirm('Delete this meal record? This action cannot be undone.')
    )
      return;

    this.mealRecordService.DeleteMealRecordById(id).subscribe({
      next: () => {
        swal('Deleted', 'Meal record deleted successfully.', 'success');
        if (String(this.mealRecordObj.id ?? '') === String(id))
          this.resetMealRecordForm();
        this.loadMealRecords();
      },
      error: (error) =>
        swal('Unable to delete meal record', this.errorMessage(error), 'error'),
    });
  }

  resetMealRecordForm(): void {
    this.mealRecordObj = this.newMealRecord();
    this.selectedChildId = '';
    this.selectedMealPlanId = '';
    this.ateMealValue = '';
    this.isEditMealRecord = false;
    this.isReadOnlyMealRecord = false;
  }

  childName(child: any): string {
    const name = `${child?.firstName ?? ''} ${child?.lastName ?? ''}`.trim();
    return name || child?.childCode || `Child ${child?.id ?? ''}`;
  }

  mealPlanLabel(plan: any): string {
    const date = plan?.mealDate
      ? String(plan.mealDate).slice(0, 10)
      : 'No date';
    const type = plan?.mealType || 'Meal';
    const menu = plan?.menuItems ? ` — ${plan.menuItems}` : '';
    return `${date} · ${type}${menu}`;
  }

  private loadClassrooms(): void {
    this.allClassroomList$ = this.mealPlanService.GetAllClassroomList().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((room: any) => ({
          ...room,
          dropdownLabel: [
            room.roomName ||
              room.classroomName ||
              room.classroomCode ||
              `Classroom #${room.id}`,
            room.roomCode,
          ]
            .filter(Boolean)
            .join(' · '),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allClassroomList$.subscribe({
      next: (items: any[]) => (this.allClassroomList = items),
      error: (error: any) => {
        this.allClassroomList = [];
        swal('Unable to load classrooms', this.errorMessage(error), 'error');
      },
    });
  }

  private loadChildren(): void {
    this.allChildList$ = this.mealRecordService.GetAllChildList().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((child: any) => ({
          ...child,
          dropdownLabel: `${this.childName(child)}${child.childCode ? ' (' + child.childCode + ')' : ''}`,
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allChildList$.subscribe({
      next: (items: any[]) => (this.allChildList = items),
      error: (error: any) => {
        this.allChildList = [];
        swal('Unable to load children', this.errorMessage(error), 'error');
      },
    });
  }

  loadMealPlans(): void {
    this.loadingPlans = true;
    this.allMealPlanList$ = this.mealPlanService.GetAllMealPlans().pipe(
      map((response: any) => unwrapApiList(response)),
      map((items: any[]) =>
        items.map((plan: any) => ({
          ...plan,
          dropdownLabel: this.mealPlanLabel(plan),
        })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.allMealPlanList$.subscribe({
      next: (items: any[]) => {
        this.mealPlans = items;
        this.allMealPlanList = items;
        this.loadingPlans = false;
      },
      error: (error: any) => {
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
    return {
      mealDate: '',
      mealType: 'Breakfast',
      menuItems: '',
      classroom: null,
    };
  }

  private newMealRecord(): MealRecordRepresentation {
    return {
      mealDate: '',
      mealType: 'Lunch',
      ateMeal: null,
      notes: '',
      child: null,
      mealPlan: null,
    };
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

  private extractOne(response: any): any | null {
    const fromList = this.extractList(response)[0];
    if (fromList) return fromList;

    const candidates = [
      response?.data?.data,
      response?.data?.item,
      response?.data,
      response,
    ];
    return (
      candidates.find(
        (candidate: any) =>
          candidate &&
          typeof candidate === 'object' &&
          !Array.isArray(candidate) &&
          candidate.id !== undefined &&
          candidate.id !== null,
      ) ?? null
    );
  }

  private errorMessage(error: any): string {
    const message =
      error?.error?.message ||
      error?.error?.error ||
      error?.error?.detail ||
      error?.message;
    if (error?.status === 0)
      return 'Cannot connect to Spring Boot. Check that the backend is running at http://localhost:8010.';
    return (
      message ||
      `Request failed${error?.status ? ` (HTTP ${error.status})` : ''}. Check the browser Console and Network tabs for details.`
    );
  }

  private scrollToForm(): void {
    scrollPageToTop();
  }
}
