import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DashboardService } from '../services/api/dashboard/dashboard.service';
import { DashboardRepresentation } from '../services/api/module/dashboard-representation';
import {
  AuthIds,
  PermissionHelperService,
} from '../services/permission-helper.service';

import Chart from 'chart.js/auto';

type RecipientType = 'Parent' | 'Staff';

interface NotificationForm {
  recipientType: RecipientType;
  recipientId: string | number | null;
  type: string;
  message: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  canView: boolean | null = null;

  @ViewChild('attendanceChartCanvas')
  attendanceChartCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('feeChartCanvas')
  feeChartCanvas?: ElementRef<HTMLCanvasElement>;

  private attendanceChart: Chart<'bar', number[], string> | null = null;

  private feeChart: Chart<'doughnut', number[], string> | null = null;

  private permissionCheckAttempts = 0;

  loading = false;
  savingNotification = false;

  message = '';
  messageIsError = false;

  attendances: any[] = [];
  classrooms: any[] = [];
  invoices: any[] = [];
  payments: any[] = [];
  incidents: any[] = [];
  children: any[] = [];
  parents: any[] = [];
  staff: any[] = [];
  statuses: any[] = [];
  notifications: DashboardRepresentation[] = [];

  checkedInAttendance: any[] = [];
  classroomSummaries: any[] = [];
  nearCapacityClassrooms: any[] = [];

  unpaidInvoices: any[] = [];
  overdueInvoices: any[] = [];

  openIncidents: any[] = [];

  totalCollectedPayments = 0;
  totalOutstandingBalance = 0;
  totalOverdueBalance = 0;
  unreadNotificationsCount = 0;

  notificationObj: NotificationForm = this.emptyNotification();

  readonly notificationTypes = [
    'General Update',
    'Fee Reminder',
    'Incident Alert',
    'Pickup Late',
  ];

  readonly today = this.localDate(new Date());

  constructor(
    private dashboardService: DashboardService,
    private permissionHelper: PermissionHelperService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.checkDashboardAccess();
  }

  private checkDashboardAccess(): void {
    const hasAccess = this.permissionHelper.has(AuthIds.MENU_DASHBOARD);

    if (hasAccess) {
      this.canView = true;
      this.refreshAll();
      return;
    }

    if (this.permissionCheckAttempts < 20) {
      this.permissionCheckAttempts++;

      setTimeout(() => {
        this.checkDashboardAccess();
      }, 150);

      return;
    }

    this.canView = false;
  }

  private emptyNotification(): NotificationForm {
    return {
      recipientType: 'Parent',
      recipientId: null,
      type: 'General Update',
      message: '',
    };
  }

  refreshAll(): void {
    this.loadDashboard(true);
  }

  private loadDashboard(clearMessage: boolean): void {
    if (clearMessage) {
      this.message = '';
    }

    this.loading = true;

    forkJoin({
      attendances: this.safeList(
        this.dashboardService.getAttendances(),
        'attendance',
      ),
      classrooms: this.safeList(
        this.dashboardService.getClassrooms(),
        'classrooms',
      ),
      invoices: this.safeList(this.dashboardService.getInvoices(), 'invoices'),
      payments: this.safeList(this.dashboardService.getPayments(), 'payments'),
      incidents: this.safeList(
        this.dashboardService.getIncidents(),
        'incidents',
      ),
      children: this.safeList(this.dashboardService.getChildren(), 'children'),
      parents: this.safeList(this.dashboardService.getParents(), 'parents'),
      staff: this.safeList(this.dashboardService.getStaff(), 'staff'),
      statuses: this.safeList(this.dashboardService.getStatuses(), 'statuses'),
      notifications: this.safeList(
        this.dashboardService.getNotifications(),
        'notifications',
      ),
    }).subscribe({
      next: (data: any) => {
        this.attendances = data.attendances;
        this.classrooms = data.classrooms;
        this.invoices = data.invoices;
        this.payments = data.payments;
        this.incidents = data.incidents;
        this.children = data.children;
        this.parents = data.parents;
        this.staff = data.staff;
        this.statuses = data.statuses;

        this.notifications = data.notifications.sort(
          (a: any, b: any) =>
            new Date(b.sentDate ?? b.sent_date ?? 0).getTime() -
            new Date(a.sentDate ?? a.sent_date ?? 0).getTime(),
        );
        this.recalculateDashboardMetrics();
        this.loading = false;

        setTimeout(() => {
          this.renderDashboardCharts();
        }, 0);
      },
      error: (error: any) => {
        console.error('Dashboard loading failed:', error);
        this.loading = false;

        this.showMessage(
          'Could not load dashboard data. Check the API endpoints.',
          true,
        );
      },
    });
  }

  private recalculateDashboardMetrics(): void {
    this.checkedInAttendance = this.attendances.filter((item: any) => {
      const checkIn =
        item.checkInTime ?? item.check_in_time ?? item.checkIn ?? item.check_in;

      const checkOut =
        item.checkOutTime ??
        item.check_out_time ??
        item.checkOut ??
        item.check_out;

      const date = this.dateOnly(
        item.attendanceDate ?? item.attendance_date ?? checkIn,
      );

      return date === this.today && !!checkIn && !checkOut;
    });

    this.classroomSummaries = this.classrooms.map((classroom: any) => {
      const classroomId = this.relationId(classroom);

      const capacity = Number(
        classroom.capacity ??
          classroom.maxChildren ??
          classroom.max_children ??
          classroom.maxCapacity ??
          classroom.max_capacity ??
          0,
      );

      const occupied = this.checkedInAttendance.filter(
        (attendance: any) =>
          String(
            this.relationId(
              attendance.classroom ??
                attendance.classroomId ??
                attendance.classroom_id,
            ),
          ) === String(classroomId),
      ).length;

      const percentage =
        capacity > 0
          ? Math.min(100, Math.round((occupied / capacity) * 100))
          : 0;

      return {
        id: classroom.id,
        name: this.classroomName(classroom),
        capacity,
        occupied,
        remaining: capacity > 0 ? Math.max(0, capacity - occupied) : null,
        percentage,
        nearCapacity: capacity > 0 && percentage >= 80,
        full: capacity > 0 && occupied >= capacity,
      };
    });

    this.nearCapacityClassrooms = this.classroomSummaries.filter(
      (room: any) => room.nearCapacity,
    );

    this.unpaidInvoices = this.invoices.filter(
      (invoice: any) => this.outstandingBalance(invoice) > 0,
    );

    this.overdueInvoices = this.unpaidInvoices.filter((invoice: any) => {
      const dueDate = this.dateOnly(invoice.dueDate ?? invoice.due_date);

      return dueDate !== '' && dueDate < this.today;
    });

    this.totalOutstandingBalance = this.unpaidInvoices.reduce(
      (total: number, invoice: any) => total + this.outstandingBalance(invoice),
      0,
    );

    this.totalOverdueBalance = this.overdueInvoices.reduce(
      (total: number, invoice: any) => total + this.outstandingBalance(invoice),
      0,
    );

    this.totalCollectedPayments = this.payments.reduce(
      (total: number, payment: any) =>
        total +
        Number(
          payment.amount ??
            payment.paymentAmount ??
            payment.payment_amount ??
            0,
        ),
      0,
    );

    this.openIncidents = this.incidents.filter((incident: any) => {
      const status = this.statusName(
        incident.status ?? incident.statusId ?? incident.status_id,
      )
        .trim()
        .toLowerCase();

      return !['resolved', 'closed', 'completed'].includes(status);
    });

    this.unreadNotificationsCount = this.notifications.filter(
      (item: any) => !Boolean(item.readStatus ?? item.read_status),
    ).length;
  }

  private safeList(request: Observable<any>, label: string): Observable<any[]> {
    return request.pipe(
      map((response: any) => this.unwrapList(response)),
      catchError((error: any) => {
        console.error(`Failed to load ${label}:`, error);

        return of([]);
      }),
    );
  }

  private unwrapList(response: any): any[] {
    const candidates = [
      response?.data?.dataList,
      response?.dataList,
      response?.data?.items,
      response?.data?.content,
      response?.items,
      response?.content,
      response?.data,
      response,
    ];

    return candidates.find((value: any) => Array.isArray(value)) || [];
  }

  get checkedInCount(): number {
    return this.checkedInAttendance.length;
  }

  childName(value: any): string {
    if (value && typeof value === 'object') {
      const fullName =
        `${value.firstName ?? value.first_name ?? ''} ` +
        `${value.lastName ?? value.last_name ?? ''}`;

      return (
        fullName.trim() ||
        value.childCode ||
        value.child_code ||
        `Child #${value.id ?? ''}`
      );
    }

    const id = this.relationId(value);

    const child = this.children.find(
      (item: any) => String(item.id) === String(id),
    );

    if (!child) {
      return id == null ? 'Unknown child' : `Child #${id}`;
    }

    return (
      (
        `${child.firstName ?? child.first_name ?? ''} ` +
        `${child.lastName ?? child.last_name ?? ''}`
      ).trim() ||
      child.childCode ||
      child.child_code ||
      `Child #${child.id}`
    );
  }

  classroomName(value: any): string {
    if (value && typeof value === 'object') {
      return (
        value.classroomName ??
        value.classroom_name ??
        value.roomName ??
        value.room_name ??
        value.name ??
        value.classroomCode ??
        value.classroom_code ??
        `Classroom #${value.id ?? ''}`
      );
    }

    const id = this.relationId(value);

    const classroom = this.classrooms.find(
      (item: any) => String(item.id) === String(id),
    );

    return classroom
      ? this.classroomName(classroom)
      : id == null
        ? 'Not assigned'
        : `Classroom #${id}`;
  }

  outstandingBalance(invoice: any): number {
    const invoiceId = this.relationId(invoice?.id);
    const total = Number(invoice?.amount ?? 0);

    const paid = this.payments
      .filter(
        (payment: any) =>
          String(
            this.relationId(
              payment.invoice ??
                payment.feeInvoice ??
                payment.invoiceId ??
                payment.invoice_id,
            ),
          ) === String(invoiceId),
      )
      .reduce(
        (sum: number, payment: any) => sum + Number(payment.amount ?? 0),
        0,
      );

    return Math.max(0, Math.round((total - paid) * 100) / 100);
  }

  invoiceCode(invoice: any): string {
    return (
      invoice?.invoiceCode ??
      invoice?.invoice_code ??
      (invoice?.id != null ? `INV-${invoice.id}` : 'Unknown invoice')
    );
  }

  formatLkr(value: any): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  incidentChildName(incident: any): string {
    return this.childName(
      incident.child ?? incident.childId ?? incident.child_id,
    );
  }

  incidentType(incident: any): string {
    return (
      incident.incidentType ??
      incident.incident_type ??
      incident.type ??
      'Incident'
    );
  }

  incidentStatus(incident: any): string {
    return (
      this.statusName(
        incident.status ?? incident.statusId ?? incident.status_id,
      ) || 'Open / Unspecified'
    );
  }

  incidentDate(incident: any): any {
    return (
      incident.incidentDate ?? incident.incident_date ?? incident.date ?? null
    );
  }

  get recipientOptions(): any[] {
    if (this.notificationObj.recipientType === 'Parent') {
      return this.parents.map((parent: any) => ({
        id: parent.id,
        label:
          parent.fullName ??
          parent.full_name ??
          `${parent.firstName ?? ''} ${parent.lastName ?? ''}`.trim() ??
          `Parent #${parent.id}`,
      }));
    }

    return this.staff
      .map((staffMember: any) => {
        const userId =
          this.relationId(staffMember.user) ??
          staffMember.userId ??
          staffMember.user_id;

        return {
          id: userId,
          label:
            staffMember.fullName ??
            staffMember.full_name ??
            staffMember.name ??
            `Staff #${staffMember.id}`,
        };
      })
      .filter(
        (item: any) =>
          item.id !== null && item.id !== undefined && item.id !== '',
      );
  }

  onRecipientTypeChange(): void {
    this.notificationObj.recipientId = null;
  }

  notificationRecipientLabel(notification: any): string {
    const type = String(
      notification.recipientType ?? notification.recipient_type ?? '',
    ).toLowerCase();

    const recipientId = this.relationId(
      notification.recipient ??
        notification.recipientId ??
        notification.recipient_id,
    );

    if (type === 'parent') {
      const parent = this.parents.find(
        (item: any) => String(item.id) === String(recipientId),
      );

      return parent
        ? (parent.fullName ?? parent.full_name ?? `Parent #${parent.id}`)
        : `Parent #${recipientId ?? '?'}`;
    }

    const staffMember = this.staff.find((item: any) => {
      const userId = this.relationId(item.user) ?? item.userId ?? item.user_id;

      return String(userId) === String(recipientId);
    });

    return staffMember
      ? (staffMember.fullName ??
          staffMember.full_name ??
          `Staff #${staffMember.id}`)
      : `Staff user #${recipientId ?? '?'}`;
  }

  isRead(notification: any): boolean {
    return Boolean(notification.readStatus ?? notification.read_status);
  }

  sendNotification(): void {
    const recipientId = this.notificationObj.recipientId;
    const messageText = String(this.notificationObj.message ?? '').trim();

    if (!recipientId) {
      this.showMessage('Please select a notification recipient.', true);
      return;
    }

    if (!this.notificationObj.type) {
      this.showMessage('Please select a notification type.', true);
      return;
    }

    if (!messageText) {
      this.showMessage('Please enter the notification message.', true);
      return;
    }

    if (messageText.length > 255) {
      this.showMessage(
        'The notification message cannot exceed 255 characters.',
        true,
      );
      return;
    }

    const payload: DashboardRepresentation = {
      recipientId,
      recipientType: this.notificationObj.recipientType,
      message: messageText,
      type: this.notificationObj.type,
      sentDate: new Date().toISOString(),
      readStatus: false,
    };

    this.savingNotification = true;

    this.dashboardService.createNotification(payload).subscribe({
      next: () => {
        this.savingNotification = false;
        this.notificationObj = this.emptyNotification();

        this.showMessage('Notification saved successfully.');

        this.loadDashboard(false);
      },
      error: (error: any) => {
        this.savingNotification = false;

        console.error('Notification creation failed:', error);

        this.showMessage(
          error?.error?.message ||
            'Could not save the notification. Check the notification API endpoint and required fields.',
          true,
        );
      },
    });
  }

  markAsRead(notification: any): void {
    if (!notification?.id || this.isRead(notification)) {
      return;
    }

    const payload: DashboardRepresentation = {
      id: notification.id,
      recipientId:
        notification.recipientId ??
        notification.recipient_id ??
        notification.recipient?.id ??
        null,
      recipientType:
        notification.recipientType ?? notification.recipient_type ?? 'Parent',
      message: notification.message ?? '',
      type: notification.type ?? '',
      sentDate: notification.sentDate ?? notification.sent_date ?? '',
      readStatus: true,
    };

    this.dashboardService
      .updateNotification(notification.id, payload)
      .subscribe({
        next: () => {
          notification.readStatus = true;
          notification.read_status = true;

          this.showMessage('Notification marked as read.');
        },
        error: (error: any) => {
          console.error('Could not mark notification as read:', error);

          this.showMessage(
            'Could not update the notification. Check whether the API supports PUT /notification/{id}.',
            true,
          );
        },
      });
  }

  private renderDashboardCharts(): void {
    const attendanceCanvas = this.attendanceChartCanvas?.nativeElement;

    const feeCanvas = this.feeChartCanvas?.nativeElement;

    if (!attendanceCanvas || !feeCanvas) {
      return;
    }

    this.attendanceChart?.destroy();
    this.feeChart?.destroy();

    this.attendanceChart = null;
    this.feeChart = null;

    const dateKeys: string[] = [];
    const dateLabels: string[] = [];

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date();
      date.setDate(date.getDate() - offset);

      dateKeys.push(this.localDate(date));

      dateLabels.push(
        date.toLocaleDateString('en-LK', {
          weekday: 'short',
          day: 'numeric',
        }),
      );
    }

    const countsByDate = new Map<string, number>();

    dateKeys.forEach((dateKey) => {
      countsByDate.set(dateKey, 0);
    });

    for (const attendance of this.attendances) {
      const attendanceDate =
        attendance.attendanceDate ??
        attendance.attendance_date ??
        attendance.date ??
        attendance.checkInTime ??
        attendance.check_in_time ??
        attendance.checkIn ??
        attendance.check_in;

      const dateKey = this.dateOnly(attendanceDate);

      if (countsByDate.has(dateKey)) {
        countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
      }
    }

    const attendanceCounts = dateKeys.map(
      (dateKey) => countsByDate.get(dateKey) ?? 0,
    );

    const collected = Math.round(this.totalCollectedPayments * 100) / 100;

    const outstanding = Math.round(this.totalOutstandingBalance * 100) / 100;

    this.ngZone.runOutsideAngular(() => {
      this.attendanceChart = new Chart<'bar', number[], string>(
        attendanceCanvas,
        {
          type: 'bar',

          data: {
            labels: dateLabels,
            datasets: [
              {
                label: 'Attendance Records',
                data: attendanceCounts,
                backgroundColor: 'rgba(8, 127, 140, 0.78)',
                borderColor: '#087f8c',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 38,
              },
            ],
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            resizeDelay: 100,

            plugins: {
              legend: {
                display: false,
              },
            },

            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
                grid: {
                  color: '#edf1f6',
                },
              },

              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        },
      );

      this.feeChart = new Chart<'doughnut', number[], string>(feeCanvas, {
        type: 'doughnut',

        data: {
          labels: ['Payments Collected', 'Outstanding Balance'],

          datasets: [
            {
              data: [collected, outstanding],
              backgroundColor: ['#168878', '#e3a438'],
              borderColor: '#ffffff',
              borderWidth: 4,
              hoverOffset: 5,
            },
          ],
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          resizeDelay: 100,
          cutout: '67%',

          plugins: {
            legend: {
              position: 'bottom',

              labels: {
                usePointStyle: true,
                padding: 18,
              },
            },

            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.label}: ${this.formatLkr(
                    Number(context.raw ?? 0),
                  )}`,
              },
            },
          },
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.attendanceChart?.destroy();
    this.feeChart?.destroy();
  }

  statusName(value: any): string {
    if (value && typeof value === 'object') {
      return value.name ?? value.statusName ?? value.status_name ?? '';
    }

    const status = this.statuses.find(
      (item: any) => String(item.id) === String(value),
    );

    return status?.name ?? (value == null ? '' : String(value));
  }

  private relationId(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return typeof value === 'object' ? (value.id ?? null) : value;
  }

  private dateOnly(value: any): string {
    if (!value) {
      return '';
    }

    return String(value).slice(0, 10);
  }

  private localDate(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  private showMessage(message: string, isError = false): void {
    this.message = message;
    this.messageIsError = isError;
  }
}
