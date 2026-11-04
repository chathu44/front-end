import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';

import { ReportService } from '../services/api/report/report.service';
import { normalizeLookupName, resolveRecordStatusName } from '../services/lookup-utils';

type ReportTab = 'overview' | 'attendance' | 'finance' | 'occupancy';

interface ExportTable {
  headers: string[];
  rows: Array<Array<string | number>>;
}

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit, OnDestroy {
  @ViewChild('attendanceTrendCanvas')
  attendanceTrendCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('feeTrendCanvas')
  feeTrendCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('occupancyCanvas')
  occupancyCanvas?: ElementRef<HTMLCanvasElement>;

  activeReport: ReportTab = 'overview';
  loading = false;
  loadWarning = '';
  validationMessage = '';
  lastUpdated: Date | null = null;

  fromDate = '';
  toDate = '';

  attendanceTableFilters: { [key: string]: any } = {};
  readonly attendanceFilterFields: { [key: string]: string } = {
    date: 'date',
    child: 'child',
    classroom: 'classroom',
    checkIn: 'checkIn',
    checkOut: 'checkOut',
    status: 'status',
  };
  readonly attendanceFilterLabels = {
    date: 'Date', child: 'Child', classroom: 'Classroom',
    checkIn: 'Check-in', checkOut: 'Check-out', status: 'Status',
  };
  readonly attendanceTextFields = ['child', 'classroom'];
  readonly attendanceFilterOptions = {
    status: ['Present', 'Absent', 'Late', 'Left Early', 'In daycare', 'Picked up', 'Not recorded'],
  };

  financeTableFilters: { [key: string]: any } = {};
  readonly financeFilterFields: { [key: string]: string } = {
    date: 'date', invoice: 'invoice', child: 'child', amount: 'amount',
    method: 'method', receivedBy: 'receivedBy',
  };
  readonly financeFilterLabels = {
    date: 'Payment date', invoice: 'Invoice', child: 'Child',
    amount: 'Amount', method: 'Payment method', receivedBy: 'Received by',
  };
  readonly financeTextFields = ['invoice', 'child'];
  financeFilterOptionItems: { [key: string]: any[] } = { receivedBy: [] };
  readonly financeFilterOptionPaths = { receivedBy: 'fullName|full_name|name|staffCode|staff_code' };

  occupancyTableFilters: { [key: string]: any } = {};
  readonly occupancyFilterFields: { [key: string]: string } = {
    room: 'room', code: 'code', floor: 'floor', ageGroup: 'ageGroup',
    capacity: 'capacity', uniqueChildren: 'uniqueChildren',
    averageDaily: 'averageDaily', utilization: 'utilization',
  };
  readonly occupancyFilterLabels = {
    room: 'Classroom', code: 'Room code', floor: 'Floor', ageGroup: 'Age group',
    capacity: 'Capacity', uniqueChildren: 'Unique children',
    averageDaily: 'Avg. daily attendance', utilization: 'Utilisation (%)',
  };
  readonly occupancyTextFields = ['room', 'code'];
  readonly occupancyFilterOptions = {
    floor: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'],
    ageGroup: ['0-1 Years', '1-2 Years', '2-3 Years', '3-5 Years', '5+ Years'],
  };

  attendances: any[] = [];
  invoices: any[] = [];
  payments: any[] = [];
  classrooms: any[] = [];
  children: any[] = [];
  staff: any[] = [];
  incidents: any[] = [];
  statuses: any[] = [];

  private attendanceChart: Chart<'line', number[], string> | null = null;
  private feeChart: Chart<'bar', number[], string> | null = null;
  private occupancyChart: Chart<'bar', number[], string> | null = null;
  private loadWarnings: string[] = [];
  private cacheReady = false;
  private cacheFromDate = '';
  private cacheToDate = '';
  private cacheAttendances: any[] | null = null;
  private cacheInvoices: any[] | null = null;
  private cachePayments: any[] | null = null;
  private cacheClassrooms: any[] | null = null;
  private cacheChildren: any[] | null = null;
  private cacheStaff: any[] | null = null;
  private cacheIncidents: any[] | null = null;
  private cacheStatuses: any[] | null = null;
  private cachedFilteredAttendances: any[] = [];
  private cachedFilteredPayments: any[] = [];
  private cachedFilteredIncidents: any[] = [];
  private cachedAttendanceRows: any[] = [];
  private cachedPaymentRows: any[] = [];
  private cachedOccupancyRows: any[] = [];
  private cachedAttendanceStatus = { labels: [] as string[], values: [] as number[] };
  private cachedMonthlyAttendance = { labels: [] as string[], values: [] as number[] };
  private cachedMonthlyFees = { labels: [] as string[], values: [] as number[] };
  private cachedTotalCollected = 0;
  private cachedTotalOutstanding = 0;
  private cachedTotalOverdue = 0;
  private cachedOpenIncidentCount = 0;
  private cachedUniqueChildrenAttended = 0;
  private cachedAverageOccupancy = 0;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    const today = new Date();
    this.toDate = this.toLocalDate(today);
    this.fromDate = this.toLocalDate(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadReports(): void {
    this.loading = true;
    this.loadWarning = '';
    this.validationMessage = '';
    this.loadWarnings = [];

    forkJoin({
      attendances: this.safeList(this.reportService.getAttendances(), 'attendance'),
      invoices: this.safeList(this.reportService.getInvoices(), 'fee invoices'),
      payments: this.safeList(this.reportService.getPayments(), 'fee payments'),
      classrooms: this.safeList(this.reportService.getClassrooms(), 'classrooms'),
      children: this.safeList(this.reportService.getChildren(), 'children'),
      staff: this.safeList(this.reportService.getStaff(), 'staff'),
      incidents: this.safeList(this.reportService.getIncidents(), 'incidents'),
      statuses: this.safeList(this.reportService.getStatuses(), 'statuses'),
    }).subscribe({
      next: (data: any) => {
        this.attendances = data.attendances;
        this.invoices = data.invoices;
        this.payments = data.payments;
        this.classrooms = data.classrooms;
        this.children = data.children;
        this.staff = data.staff;
        this.financeFilterOptionItems = { receivedBy: this.staff };
        this.incidents = data.incidents;
        this.statuses = data.statuses;
        this.loading = false;
        this.lastUpdated = new Date();

        if (this.loadWarnings.length) {
          this.loadWarning =
            'Some report data could not be loaded: ' +
            this.loadWarnings.join(', ') +
            '. Check that the related modules and API are available.';
        }

        this.scheduleChartRender();
      },
      error: (error: any) => {
        console.error('Report data loading failed:', error);
        this.loading = false;
        this.loadWarning = 'Could not load report data. Check the backend connection and try again.';
      },
    });
  }

  private safeList(request: Observable<any>, label: string): Observable<any[]> {
    return request.pipe(
      map((response: any) => this.unwrapList(response)),
      catchError((error: any) => {
        console.error(`Report API failed for ${label}:`, error);
        this.loadWarnings.push(label);
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
    return candidates.find((candidate: any) => Array.isArray(candidate)) || [];
  }

  applyDateRange(): void {
    if (!this.fromDate || !this.toDate) {
      this.validationMessage = 'Select both a start date and an end date.';
      return;
    }
    if (this.fromDate > this.toDate) {
      this.validationMessage = 'The start date cannot be later than the end date.';
      return;
    }
    this.validationMessage = '';
    this.scheduleChartRender();
  }

  setPreset(preset: 'this-month' | 'last-month' | 'last-30-days' | 'this-year'): void {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'this-month') {
      this.fromDate = this.toLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
      this.toDate = this.toLocalDate(end);
    } else if (preset === 'last-month') {
      this.fromDate = this.toLocalDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      this.toDate = this.toLocalDate(new Date(today.getFullYear(), today.getMonth(), 0));
    } else if (preset === 'last-30-days') {
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      this.fromDate = this.toLocalDate(start);
      this.toDate = this.toLocalDate(end);
    } else {
      this.fromDate = this.toLocalDate(new Date(today.getFullYear(), 0, 1));
      this.toDate = this.toLocalDate(end);
    }

    this.applyDateRange();
  }

  selectReport(report: ReportTab): void {
    this.activeReport = report;
    this.scheduleChartRender();
  }

  get filteredAttendances(): any[] {
    this.ensureReportCache();
    return this.cachedFilteredAttendances;
  }

  get filteredPayments(): any[] {
    this.ensureReportCache();
    return this.cachedFilteredPayments;
  }

  get filteredIncidents(): any[] {
    this.ensureReportCache();
    return this.cachedFilteredIncidents;
  }

  get openIncidentCount(): number {
    this.ensureReportCache();
    return this.cachedOpenIncidentCount;
  }

  get totalCollected(): number {
    this.ensureReportCache();
    return this.cachedTotalCollected;
  }

  get totalOutstanding(): number {
    this.ensureReportCache();
    return this.cachedTotalOutstanding;
  }

  get totalOverdue(): number {
    this.ensureReportCache();
    return this.cachedTotalOverdue;
  }

  get attendanceRows(): any[] {
    this.ensureReportCache();
    return this.cachedAttendanceRows;
  }

  get paymentRows(): any[] {
    this.ensureReportCache();
    return this.cachedPaymentRows;
  }

  get occupancyRows(): any[] {
    this.ensureReportCache();
    return this.cachedOccupancyRows;
  }

  get averageOccupancy(): number {
    this.ensureReportCache();
    return this.cachedAverageOccupancy;
  }

  get totalAttendanceRecords(): number {
    this.ensureReportCache();
    return this.cachedFilteredAttendances.length;
  }

  get uniqueChildrenAttended(): number {
    this.ensureReportCache();
    return this.cachedUniqueChildrenAttended;
  }

  private ensureReportCache(): void {
    const hasChanged =
      !this.cacheReady ||
      this.cacheFromDate !== this.fromDate ||
      this.cacheToDate !== this.toDate ||
      this.cacheAttendances !== this.attendances ||
      this.cacheInvoices !== this.invoices ||
      this.cachePayments !== this.payments ||
      this.cacheClassrooms !== this.classrooms ||
      this.cacheChildren !== this.children ||
      this.cacheStaff !== this.staff ||
      this.cacheIncidents !== this.incidents ||
      this.cacheStatuses !== this.statuses;

    if (!hasChanged) return;

    this.cacheReady = true;
    this.cacheFromDate = this.fromDate;
    this.cacheToDate = this.toDate;
    this.cacheAttendances = this.attendances;
    this.cacheInvoices = this.invoices;
    this.cachePayments = this.payments;
    this.cacheClassrooms = this.classrooms;
    this.cacheChildren = this.children;
    this.cacheStaff = this.staff;
    this.cacheIncidents = this.incidents;
    this.cacheStatuses = this.statuses;

    this.cachedFilteredAttendances = this.attendances.filter((record: any) =>
      this.isWithinRange(this.attendanceDate(record)),
    );
    this.cachedFilteredPayments = this.payments.filter((record: any) =>
      this.isWithinRange(record?.paymentDate ?? record?.payment_date ?? record?.createdDate ?? record?.created_date),
    );
    this.cachedFilteredIncidents = this.incidents.filter((record: any) =>
      this.isWithinRange(record?.incidentDate ?? record?.incident_date),
    );

    this.cachedAttendanceRows = this.cachedFilteredAttendances
      .map((record: any) => ({
        date: this.attendanceDate(record),
        child: this.childName(record?.child),
        classroom: this.classroomName(record?.classroom),
        checkIn: this.timeOnly(record?.checkInTime ?? record?.check_in_time),
        checkOut: this.timeOnly(record?.checkOutTime ?? record?.check_out_time),
        status: this.attendanceStatus(record),
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date));

    this.cachedPaymentRows = this.cachedFilteredPayments
      .map((payment: any) => {
        const invoice = this.findInvoice(payment?.invoice ?? payment?.feeInvoice ?? payment?.invoiceId ?? payment?.invoice_id);
        const childValue = invoice?.child ?? payment?.child;
        return {
          date: this.dateTimeLabel(payment?.paymentDate ?? payment?.payment_date),
          invoice: invoice?.invoiceCode ?? invoice?.invoice_code ?? `Invoice #${this.relationId(payment?.invoice) ?? ''}`,
          child: this.childName(childValue),
          amount: this.amount(payment?.amount),
          method: payment?.paymentMethod ?? payment?.payment_method ?? '—',
          receivedBy: this.staffName(payment?.receivedBy ?? payment?.received_by),
        };
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date));

    this.cachedOccupancyRows = this.buildOccupancyRows(this.cachedFilteredAttendances);
    const roomsWithCapacity = this.cachedOccupancyRows.filter((row: any) => row.capacity > 0);
    const totalCapacity = roomsWithCapacity.reduce((sum: number, row: any) => sum + row.capacity, 0);
    const totalAverageAttendance = roomsWithCapacity.reduce((sum: number, row: any) => sum + row.averageDaily, 0);
    this.cachedAverageOccupancy = totalCapacity > 0
      ? (totalAverageAttendance / totalCapacity) * 100
      : 0;

    this.cachedTotalCollected = this.cachedFilteredPayments.reduce(
      (total: number, payment: any) => total + this.amount(payment?.amount ?? payment?.paymentAmount ?? payment?.payment_amount),
      0,
    );
    this.cachedTotalOutstanding = this.invoices.reduce(
      (total: number, invoice: any) => total + this.outstandingBalance(invoice),
      0,
    );
    const today = this.toLocalDate(new Date());
    this.cachedTotalOverdue = this.invoices.reduce((total: number, invoice: any) => {
      const dueDate = this.dateOnly(invoice?.dueDate ?? invoice?.due_date);
      const balance = this.outstandingBalance(invoice);
      return total + (dueDate && dueDate < today && balance > 0 ? balance : 0);
    }, 0);
    this.cachedOpenIncidentCount = this.cachedFilteredIncidents.filter((incident: any) => {
      const status = normalizeLookupName(resolveRecordStatusName(incident, this.statuses));
      return !['resolved', 'closed', 'completed'].includes(status);
    }).length;
    this.cachedUniqueChildrenAttended = new Set(
      this.cachedFilteredAttendances
        .map((record: any) => this.relationId(record?.child))
        .filter((id: any) => id != null)
        .map((id: any) => String(id)),
    ).size;

    this.cachedMonthlyAttendance = this.groupByMonth(
      this.cachedFilteredAttendances,
      (row: any) => this.attendanceDate(row),
      () => 1,
    );
    this.cachedMonthlyFees = this.groupByMonth(
      this.cachedFilteredPayments,
      (row: any) => this.dateOnly(row?.paymentDate ?? row?.payment_date ?? row?.createdDate ?? row?.created_date),
      (row: any) => this.amount(row?.amount),
    );
    const statusCounts = new Map<string, number>();
    this.cachedFilteredAttendances.forEach((row: any) => {
      const label = this.attendanceStatus(row);
      statusCounts.set(label, (statusCounts.get(label) ?? 0) + 1);
    });
    const statusEntries = Array.from(statusCounts.entries()).sort((a, b) => b[1] - a[1]);
    this.cachedAttendanceStatus = {
      labels: statusEntries.map((item) => item[0]),
      values: statusEntries.map((item) => item[1]),
    };
  }

  private buildOccupancyRows(filteredAttendances: any[]): any[] {
    const roomStats = new Map<string, { daily: Map<string, Set<string>>; children: Set<string> }>();

    filteredAttendances.forEach((record: any) => {
      const roomId = this.relationId(record?.classroom);
      const childId = this.relationId(record?.child);
      const day = this.attendanceDate(record);
      if (roomId == null || !day) return;

      const key = String(roomId);
      if (!roomStats.has(key)) {
        roomStats.set(key, { daily: new Map<string, Set<string>>(), children: new Set<string>() });
      }
      const stats = roomStats.get(key)!;
      if (!stats.daily.has(day)) stats.daily.set(day, new Set<string>());
      const uniqueChildKey = childId == null
        ? `attendance-${record?.id ?? stats.daily.get(day)!.size}`
        : String(childId);
      stats.daily.get(day)!.add(uniqueChildKey);
      stats.children.add(uniqueChildKey);
    });

    return this.classrooms.map((room: any) => {
      const roomId = this.relationId(room);
      const stats = roomId == null ? undefined : roomStats.get(String(roomId));
      const totalChildDays = stats
        ? Array.from(stats.daily.values()).reduce((sum: number, ids: Set<string>) => sum + ids.size, 0)
        : 0;
      const recordedDays = stats?.daily.size ?? 0;
      const averageDaily = recordedDays > 0 ? totalChildDays / recordedDays : 0;
      const capacity = this.amount(room?.capacity ?? room?.maxChildren ?? room?.max_children);
      const utilization = capacity > 0 ? (averageDaily / capacity) * 100 : 0;

      return {
        room: this.classroomName(room),
        code: room?.roomCode ?? room?.room_code ?? `ROOM-${roomId ?? ''}`,
        floor: room?.floor ?? '—',
        ageGroup: room?.ageGroup ?? room?.age_group ?? '—',
        capacity,
        uniqueChildren: stats?.children.size ?? 0,
        averageDaily,
        utilization,
      };
    }).sort((a: any, b: any) => b.utilization - a.utilization);
  }

  get selectedDayCount(): number {
    if (!this.fromDate || !this.toDate || this.fromDate > this.toDate) return 0;
    const start = new Date(`${this.fromDate}T00:00:00`).getTime();
    const end = new Date(`${this.toDate}T00:00:00`).getTime();
    return Math.max(1, Math.floor((end - start) / 86400000) + 1);
  }

  get monthlyAttendance(): { labels: string[]; values: number[] } {
    this.ensureReportCache();
    return this.cachedMonthlyAttendance;
  }

  get monthlyFees(): { labels: string[]; values: number[] } {
    this.ensureReportCache();
    return this.cachedMonthlyFees;
  }

  get attendanceStatusSummary(): { labels: string[]; values: number[] } {
    this.ensureReportCache();
    return this.cachedAttendanceStatus;
  }

  private groupByMonth(
    rows: any[],
    dateSelector: (row: any) => string,
    valueSelector: (row: any) => number,
  ): { labels: string[]; values: number[] } {
    const groups = new Map<string, number>();
    rows.forEach((row: any) => {
      const date = dateSelector(row);
      if (!date) return;
      const month = date.slice(0, 7);
      groups.set(month, (groups.get(month) ?? 0) + valueSelector(row));
    });
    const entries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: entries.map((entry) => this.monthLabel(entry[0])),
      values: entries.map((entry) => Math.round(entry[1] * 100) / 100),
    };
  }

  private scheduleChartRender(): void {
    this.destroyCharts();
    if (this.activeReport !== 'overview') return;
    setTimeout(() => this.renderCharts(), 0);
  }

  private renderCharts(): void {
    if (this.activeReport !== 'overview') return;

    const attendance = this.monthlyAttendance;
    const fees = this.monthlyFees;
    const occupancy = this.occupancyRows.slice(0, 8);

    if (this.attendanceTrendCanvas?.nativeElement) {
      this.attendanceChart = new Chart(this.attendanceTrendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: attendance.labels,
          datasets: [{
            label: 'Attendance records',
            data: attendance.values,
            borderColor: '#3569b7',
            backgroundColor: 'rgba(53, 105, 183, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    if (this.feeTrendCanvas?.nativeElement) {
      this.feeChart = new Chart(this.feeTrendCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: fees.labels,
          datasets: [{
            label: 'Collected (LKR)',
            data: fees.values,
            backgroundColor: '#2d9b83',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    if (this.occupancyCanvas?.nativeElement) {
      this.occupancyChart = new Chart(this.occupancyCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: occupancy.map((row: any) => row.room),
          datasets: [{
            label: 'Average daily occupancy (%)',
            data: occupancy.map((row: any) => Math.round(row.utilization * 10) / 10),
            backgroundColor: '#e2a54a',
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, suggestedMax: 100 } },
        },
      });
    }
  }

  private destroyCharts(): void {
    this.attendanceChart?.destroy();
    this.feeChart?.destroy();
    this.occupancyChart?.destroy();
    this.attendanceChart = null;
    this.feeChart = null;
    this.occupancyChart = null;
  }

  exportCsv(): void {
    const table = this.exportTable();
    const csvRows = [table.headers, ...table.rows].map((row: Array<string | number>) =>
      row.map((value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${this.reportFileName()}.csv`);
  }

  exportPdf(): void {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const table = this.exportTable();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 28;
    let y = 18;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('BrightCare Daycare', 14, y);
    y += 8;
    pdf.setFontSize(13);
    pdf.text(this.reportTitle(), 14, y);
    y += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Period: ${this.fromDate} to ${this.toDate}`, 14, y);
    pdf.text(`Generated: ${this.toLocalDate(new Date())}`, pageWidth - 14, y, { align: 'right' });
    y += 9;

    const summary = this.summaryLines();
    summary.forEach((line: string) => {
      pdf.text(line, 14, y);
      y += 5;
    });
    y += 3;

    pdf.setFont('helvetica', 'bold');
    const headerText = table.headers.join('   |   ');
    const headerLines = pdf.splitTextToSize(headerText, contentWidth);
    pdf.text(headerLines, 14, y);
    y += headerLines.length * 5 + 2;
    pdf.setDrawColor(210, 220, 232);
    pdf.line(14, y - 2, pageWidth - 14, y - 2);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    table.rows.forEach((row: Array<string | number>) => {
      const text = row.map((value: string | number) => String(value ?? '')).join('   |   ');
      const lines = pdf.splitTextToSize(text, contentWidth);
      const requiredHeight = lines.length * 4.5 + 3;
      if (y + requiredHeight > pdf.internal.pageSize.getHeight() - 14) {
        pdf.addPage();
        y = 16;
      }
      pdf.text(lines, 14, y);
      y += requiredHeight;
    });

    for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
      pdf.setPage(page);
      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.text(`Page ${page} of ${pdf.getNumberOfPages()}`, pageWidth - 14, pdf.internal.pageSize.getHeight() - 7, { align: 'right' });
    }

    pdf.save(`${this.reportFileName()}.pdf`);
  }

  private exportTable(): ExportTable {
    if (this.activeReport === 'attendance') {
      return {
        headers: ['Date', 'Child', 'Classroom', 'Check-in', 'Check-out', 'Status'],
        rows: this.attendanceRows.map((row: any) => [row.date, row.child, row.classroom, row.checkIn, row.checkOut, row.status]),
      };
    }

    if (this.activeReport === 'finance') {
      return {
        headers: ['Payment Date', 'Invoice', 'Child', 'Amount (LKR)', 'Method', 'Received By'],
        rows: this.paymentRows.map((row: any) => [row.date, row.invoice, row.child, row.amount, row.method, row.receivedBy]),
      };
    }

    if (this.activeReport === 'occupancy') {
      return {
        headers: ['Classroom', 'Code', 'Floor', 'Age Group', 'Capacity', 'Unique Children', 'Average Daily Attendance', 'Utilization (%)'],
        rows: this.occupancyRows.map((row: any) => [row.room, row.code, row.floor, row.ageGroup, row.capacity, row.uniqueChildren, row.averageDaily.toFixed(1), row.utilization.toFixed(1)]),
      };
    }

    return {
      headers: ['Report Metric', 'Value'],
      rows: [
        ['Attendance records', this.totalAttendanceRecords],
        ['Unique children attended', this.uniqueChildrenAttended],
        ['Fees collected (LKR)', this.totalCollected.toFixed(2)],
        ['Outstanding fees (LKR)', this.totalOutstanding.toFixed(2)],
        ['Overdue balance (LKR)', this.totalOverdue.toFixed(2)],
        ['Open incidents', this.openIncidentCount],
        ['Average classroom utilization (%)', this.averageOccupancy.toFixed(1)],
      ],
    };
  }

  private summaryLines(): string[] {
    return [
      `Attendance records: ${this.totalAttendanceRecords} | Unique children: ${this.uniqueChildrenAttended}`,
      `Fees collected: ${this.formatLkr(this.totalCollected)} | Outstanding: ${this.formatLkr(this.totalOutstanding)} | Overdue: ${this.formatLkr(this.totalOverdue)}`,
      `Open incidents: ${this.openIncidentCount} | Average classroom utilization: ${this.averageOccupancy.toFixed(1)}%`,
    ];
  }

  private reportTitle(): string {
    const titles: Record<ReportTab, string> = {
      overview: 'Management Overview',
      attendance: 'Attendance Summary',
      finance: 'Fee Collection Report',
      occupancy: 'Classroom Occupancy Report',
    };
    return titles[this.activeReport];
  }

  private reportFileName(): string {
    return `brightcare-${this.activeReport}-report-${this.fromDate}-to-${this.toDate}`;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private outstandingBalance(invoice: any): number {
    const invoiceId = this.relationId(invoice?.id);
    const invoiceAmount = this.amount(invoice?.amount);
    const paid = this.payments
      .filter((payment: any) =>
        String(this.relationId(payment?.invoice ?? payment?.feeInvoice ?? payment?.invoiceId ?? payment?.invoice_id)) === String(invoiceId),
      )
      .reduce((total: number, payment: any) => total + this.amount(payment?.amount), 0);
    return Math.max(0, Math.round((invoiceAmount - paid) * 100) / 100);
  }

  private findInvoice(value: any): any | undefined {
    if (value && typeof value === 'object' && (value.invoiceCode || value.invoice_code)) return value;
    const id = this.relationId(value);
    return this.invoices.find((invoice: any) => String(invoice?.id) === String(id));
  }

  childName(value: any): string {
    if (value && typeof value === 'object') {
      const name = `${value.firstName ?? value.first_name ?? ''} ${value.lastName ?? value.last_name ?? ''}`.trim();
      return name || value.childCode || value.child_code || `Child #${value.id ?? ''}`;
    }
    const id = this.relationId(value);
    const child = this.children.find((item: any) => String(item?.id) === String(id));
    if (!child) return id == null ? 'Unknown child' : `Child #${id}`;
    const name = `${child.firstName ?? child.first_name ?? ''} ${child.lastName ?? child.last_name ?? ''}`.trim();
    return name || child.childCode || child.child_code || `Child #${child.id}`;
  }

  private classroomName(value: any): string {
    if (value && typeof value === 'object') {
      return value.roomName ?? value.room_name ?? value.classroomName ?? value.classroom_name ?? value.roomCode ?? value.room_code ?? `Classroom #${value.id ?? ''}`;
    }
    const id = this.relationId(value);
    const room = this.classrooms.find((item: any) => String(item?.id) === String(id));
    return room ? this.classroomName(room) : id == null ? 'Unassigned' : `Classroom #${id}`;
  }

  private staffName(value: any): string {
    if (value && typeof value === 'object') {
      return value.fullName ?? value.full_name ?? value.name ?? value.staffCode ?? value.staff_code ?? `Staff #${value.id ?? ''}`;
    }
    const id = this.relationId(value);
    const member = this.staff.find((item: any) => String(item?.id) === String(id));
    return member ? this.staffName(member) : id == null ? '—' : `Staff #${id}`;
  }

  private attendanceStatus(record: any): string {
    const direct = resolveRecordStatusName(record, this.statuses);
    if (direct) return direct;
    const checkOut = record?.checkOutTime ?? record?.check_out_time;
    const checkIn = record?.checkInTime ?? record?.check_in_time;
    if (checkOut) return 'Picked up';
    if (checkIn) return 'In daycare';
    return 'Not recorded';
  }

  private attendanceDate(record: any): string {
    return this.dateOnly(
      record?.attendanceDate ?? record?.attendance_date ?? record?.checkInTime ?? record?.check_in_time,
    );
  }

  private dateOnly(value: any): string {
    if (value == null || value === '') return '';
    const text = String(value);
    return text.length >= 10 ? text.slice(0, 10) : text;
  }

  private timeOnly(value: any): string {
    if (value == null || value === '') return '—';
    const text = String(value);
    if (text.includes('T')) return text.slice(11, 16);
    if (text.includes(' ')) return text.slice(11, 16);
    return text.slice(0, 5);
  }

  private dateTimeLabel(value: any): string {
    if (value == null || value === '') return '—';
    const text = String(value);
    return text.replace('T', ' ').slice(0, 16);
  }

  private isWithinRange(value: any): boolean {
    const date = this.dateOnly(value);
    return !!date && date >= this.fromDate && date <= this.toDate;
  }

  private relationId(value: any): any {
    if (value == null || value === '') return null;
    return typeof value === 'object' ? value.id ?? null : value;
  }

  private amount(value: any): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatLkr(value: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value || 0);
  }

  formatPercent(value: number): string {
    return `${(value || 0).toFixed(1)}%`;
  }

  private monthLabel(monthKey: string): string {
    const date = new Date(`${monthKey}-01T00:00:00`);
    return new Intl.DateTimeFormat('en-LK', { month: 'short', year: 'numeric' }).format(date);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
