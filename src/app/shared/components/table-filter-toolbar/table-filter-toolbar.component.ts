import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TableColumnFilterPipe } from '../../pipes/table-column-filter.pipe';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'month' | 'time' | 'number';
  paths: string;
}

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-table-filter-toolbar',
  templateUrl: './table-filter-toolbar.component.html',
  styleUrls: ['./table-filter-toolbar.component.scss'],
})
export class TableFilterToolbarComponent implements OnChanges {
  @Input() items: any[] | null | undefined = [];
  @Input() fields: { [key: string]: string } = {};
  @Input() labels: { [key: string]: string } = {};
  @Input() filters: { [key: string]: any } = {};
  @Input() resetKey: any = null;
  @Input() hiddenFields: string[] = [];
  @Input() textFields: string[] = [];
  @Input() optionValues: { [key: string]: Array<string | { value: string; label: string }> } = {};
  @Input() optionItems: { [key: string]: any[] } = {};
  @Input() optionPaths: { [key: string]: string } = {};
  @Input() sortKey = '$sortField';
  @Input() directionKey = '$sortDirection';
  @Input() heading = 'Filters';
  @Output() filtersChange = new EventEmitter<{ [key: string]: any }>();

  panelOpen = false;
  filterFields: FilterField[] = [];

  private readonly valuePipe = new TableColumnFilterPipe();
  private readonly optionsCache = new Map<string, { source: any[]; options: FilterOption[] }>();
  private countCache: {
    items: any[] | null;
    filters: { [key: string]: any };
    fields: { [key: string]: string };
    sortKey: string;
    directionKey: string;
    count: number;
  } | null = null;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['labels'] || changes['hiddenFields'] || changes['textFields']) {
      const hidden = new Set(this.hiddenFields || []);
      this.filterFields = Object.keys(this.fields || {})
        .filter((key) => !hidden.has(key))
        .map((key) => ({
          key,
          label: this.labels[key] || this.makeLabel(key),
          type: this.getType(key, this.fields[key]),
          paths: this.fields[key],
        }));
      this.optionsCache.clear();
      this.countCache = null;
    }

    if (changes['optionItems'] || changes['optionValues'] || changes['optionPaths']) {
      this.optionsCache.clear();
      this.countCache = null;
    }

    if (changes['items']) {
      this.optionsCache.clear();
      this.countCache = null;
    }

    if (changes['filters']) {
      this.countCache = null;
    }
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  get filteredCount(): number {
    const source = Array.isArray(this.items) ? this.items : null;
    if (
      this.countCache &&
      this.countCache.items === source &&
      this.countCache.filters === this.filters &&
      this.countCache.fields === this.fields &&
      this.countCache.sortKey === this.sortKey &&
      this.countCache.directionKey === this.directionKey
    ) {
      return this.countCache.count;
    }

    const count = this.valuePipe.transform(
      source,
      this.filters,
      this.fields,
      this.sortKey,
      this.directionKey,
    ).length;

    this.countCache = {
      items: source,
      filters: this.filters,
      fields: this.fields,
      sortKey: this.sortKey,
      directionKey: this.directionKey,
      count,
    };
    return count;
  }

  get totalCount(): number {
    return Array.isArray(this.items) ? this.items.length : 0;
  }

  get activeFilterCount(): number {
    return this.filterFields.filter((field) => this.hasValue(this.filters[field.key])).length;
  }

  get hasAppliedFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  get isSorted(): boolean {
    return Boolean(this.filters?.[this.sortKey]);
  }

  get sortedByLabel(): string {
    const key = this.filters?.[this.sortKey];
    return key ? (this.labels[key] || this.makeLabel(key)) : '';
  }

  get sortDirectionLabel(): string {
    return String(this.filters?.[this.directionKey] || 'asc').toLowerCase() === 'desc'
      ? 'Descending'
      : 'Ascending';
  }

  optionsFor(field: FilterField): FilterOption[] {
    const explicitValues = this.optionValues?.[field.key];
    const hasExplicitValues = Object.prototype.hasOwnProperty.call(
      this.optionValues || {},
      field.key,
    );
    const source = Array.isArray(this.optionItems?.[field.key])
      ? this.optionItems[field.key]
      : Array.isArray(this.items)
        ? this.items
        : [];
    const cached = this.optionsCache.get(field.key);
    if (cached && cached.source === source) return cached.options;

    const values = new Map<string, string>();
    const addValue = (value: any): void => {
      const normalized = value === null || value === undefined ? '' : String(value).trim();
      if (!normalized) return;
      const key = normalized.toLocaleLowerCase();
      if (!values.has(key)) values.set(key, normalized);
    };

    if (hasExplicitValues) {
      (explicitValues || []).forEach((entry: any) => {
        if (entry && typeof entry === 'object') addValue(entry.value ?? entry.label);
        else addValue(entry);
      });
    } else {
      this.defaultOptionsFor(field.key).forEach(addValue);
      const paths = this.optionPaths?.[field.key] || field.paths;
      for (const item of source) {
        const raw = typeof item === 'string' || typeof item === 'number'
          ? item
          : this.valuePipe.readFieldValue(item, paths);
        addValue(this.valuePipe.normalizeFieldValue(raw));
      }
    }

    const options = Array.from(values.values())
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((value) => ({ value, label: value }));

    this.optionsCache.set(field.key, { source, options });
    return options;
  }

  private defaultOptionsFor(key: string): string[] {
    const normalized = String(key || '').toLowerCase();
    if (normalized.includes('atemeal')) return ['Yes', 'No'];
    if (normalized.includes('relationship')) return ['Mother', 'Father', 'Guardian', 'Other'];
    if (normalized.includes('gender')) return ['Male', 'Female', 'Other'];
    if (normalized.includes('bloodgroup')) return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (normalized.includes('floor')) return ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
    if (normalized.includes('agegroup')) return ['0-1 Years', '1-2 Years', '2-3 Years', '3-5 Years', '5+ Years'];
    if (normalized.includes('parentnotified')) return ['Yes', 'No'];
    if (normalized.includes('meal')) return ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Other'];
    if (normalized.includes('method')) return ['Cash', 'Card', 'Bank Transfer', 'Online', 'PayHere', 'Cheque'];
    return [];
  }

  trackByField(_index: number, field: FilterField): string {
    return field.key;
  }

  trackByOption(_index: number, option: FilterOption): string {
    return option.value;
  }

  rangeValue(key: string, bound: 'from' | 'to'): string {
    return this.filters[key]?.[bound] ?? '';
  }

  singleValue(key: string): string {
    return this.filters[key]?.value ?? '';
  }

  rangeMode(key: string): 'single' | 'range' {
    return this.filters[key]?.mode === 'single' ? 'single' : 'range';
  }

  setRangeMode(key: string, mode: 'single' | 'range'): void {
    this.updateFilter(key, { mode });
  }

  setSingleValue(key: string, value: string | number): void {
    if (value === null || value === undefined || value === '') {
      this.updateFilter(key, undefined);
    } else {
      this.updateFilter(key, { mode: 'single', value });
    }
  }

  setValue(key: string, value: any): void {
    const field = this.filterFields.find((item) => item.key === key);
    if (field?.type === 'text') {
      const text = value === null || value === undefined ? '' : String(value).trim();
      this.updateFilter(key, text ? { mode: 'text', value: text } : undefined);
      return;
    }
    this.updateFilter(key, value);
  }

  textValue(key: string): string {
    const value = this.filters?.[key];
    if (value && typeof value === 'object' && value['mode'] === 'text') {
      return String(value['value'] ?? '');
    }
    return typeof value === 'string' ? value : '';
  }

  setRange(key: string, bound: 'from' | 'to', value: string): void {
    const range: { [key: string]: any } = { ...(this.filters[key] || {}), mode: 'range' };
    if (value) range[bound] = value;
    else delete range[bound];

    if (!range['from'] && !range['to']) this.updateFilter(key, undefined);
    else this.updateFilter(key, range);
  }

  clearFilter(key: string): void {
    this.updateFilter(key, undefined);
  }

  clearFilters(): void {
    const next = { ...(this.filters || {}) };
    for (const field of this.filterFields) delete next[field.key];
    this.emitFilters(next);
  }

  clearSort(): void {
    const next = { ...(this.filters || {}) };
    delete next[this.sortKey];
    delete next[this.directionKey];
    this.emitFilters(next);
  }

  clearAll(): void {
    const next = { ...(this.filters || {}) };
    for (const field of this.filterFields) delete next[field.key];
    delete next[this.sortKey];
    delete next[this.directionKey];
    this.emitFilters(next);
  }

  private updateFilter(key: string, value: any): void {
    const next = { ...(this.filters || {}) };
    if (value === null || value === undefined || value === '') delete next[key];
    else next[key] = value;
    this.emitFilters(next);
  }

  private emitFilters(next: { [key: string]: any }): void {
    this.filters = next;
    this.countCache = null;
    this.filtersChange.emit(next);
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'object') {
      return this.isProvided(value['value']) || this.isProvided(value['from']) || this.isProvided(value['to']);
    }
    return String(value).trim().length > 0;
  }

  private isProvided(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private getType(key: string, paths: string): FilterField['type'] {
    if ((this.textFields || []).includes(key)) return 'text';
    const normalized = `${key} ${paths}`.toLowerCase();
    if (normalized.includes('billingmonth')) return 'month';

    const timeKeys = ['arrival', 'departure', 'sessionstart', 'sessionend', 'checkintime', 'checkouttime', 'checkin', 'checkout'];
    if (timeKeys.some((term) => normalized.includes(term)) || /(^|\.)time($|\|)/.test(normalized)) return 'time';
    if (normalized.includes('date') || normalized.includes('hiredate')) return 'date';

    const normalizedKey = key.toLowerCase();
    const numberKeys = ['amount', 'balance', 'fee', 'price', 'capacity', 'studentage', 'monthlyfee', 'received', 'uniquechildren', 'averagedaily', 'utilization'];
    if (numberKeys.some((term) => normalizedKey === term || normalizedKey.endsWith(term))) return 'number';

    const categoryKeys = [
      'relationship', 'gender', 'bloodgroup', 'status', 'role', 'agegroup', 'floor',
      'classroom', 'program', 'course', 'qualification', 'type', 'method',
      'meal', 'atemeal', 'parentnotified', 'todaystatus', 'checkedinby',
      'checkedoutby', 'receivedby', 'paymentinvoice', 'attendanceclassroom', 'invoicechild', 'dashboardincidentchild',
    ];
    if (categoryKeys.some((term) => normalizedKey.includes(term))) return 'select';
    if ((key === 'parent' || key === 'child' || key === 'program' || key === 'classroom') && (paths.includes('.') || paths.includes('@parentName'))) return 'select';
    if (normalizedKey.includes('child') && paths.toLowerCase().includes('child.')) return 'select';
    return 'text';
  }

  private makeLabel(key: string): string {
    const acronyms: { [key: string]: string } = {
      nic: 'NIC', id: 'ID', dob: 'Date of Birth',
    };
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .split(/[_\s]+/)
      .map((part) => acronyms[part.toLowerCase()] || part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
