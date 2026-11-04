import { Pipe, PipeTransform } from '@angular/core';

/**
 * Filters and sorts table rows using field paths supplied by each table.
 * A filter value can be text, a selected category, or a { from, to } range.
 */
@Pipe({
  name: 'tableColumnFilter',
  // Keep this pipe pure. The toolbar emits a new filters object for each
  // change, so Angular only recalculates when the data or filters change.
  pure: true,
})
export class TableColumnFilterPipe implements PipeTransform {
  transform<T>(
    items: T[] | null | undefined,
    filters: { [key: string]: any } | null | undefined,
    fields: { [key: string]: string },
    sortFieldKey = '$sortField',
    sortDirectionKey = '$sortDirection',
  ): T[] {
    if (!Array.isArray(items)) return [];

    const activeFilters = Object.keys(fields || {})
      .map((key) => ({
        key,
        filter: filters?.[key],
        paths: String(fields[key] ?? '').split('|').filter(Boolean),
        type: this.inferType(key, String(fields[key] ?? '')),
      }))
      .filter(({ filter }) => {
        if (filter === null || filter === undefined || filter === '') return false;
        if (typeof filter === 'object') {
          return this.isProvided(filter.value) || this.isProvided(filter.from) || this.isProvided(filter.to);
        }
        return String(filter).trim().length > 0;
      });

    let result = items.filter((item) =>
      activeFilters.every((entry) => {
        const values = entry.paths
          .map((path) => this.readValue(item, path))
          .filter((value) => value !== null && value !== undefined && value !== '');

        if (entry.filter && typeof entry.filter === 'object') {
          if (entry.filter['mode'] === 'text') {
            const wantedText = String(entry.filter['value'] ?? '').trim().toLocaleLowerCase();
            if (!wantedText) return true;
            const searchableText = values
              .map((value) => this.normalizeValue(value))
              .join(' ')
              .toLocaleLowerCase();
            return searchableText.includes(wantedText);
          }
          const value = values.length ? values[0] : undefined;
          return this.matchesRange(value, entry.filter, entry.type);
        }

        const normalized = values
          .map((value) => this.normalizeValue(value))
          .join(' ')
          .toLocaleLowerCase();
        const wanted = String(entry.filter).trim().toLocaleLowerCase();

        if (entry.type === 'select') {
          const exactMatch = values.some(
            (value) => this.normalizeValue(value).trim().toLocaleLowerCase() === wanted,
          );
          if (exactMatch) return true;
          if (!this.isEntitySelectField(entry.key)) return false;
          const normalizedWords = normalized
            .replace(/[^a-z0-9]+/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
          const wantedWords = wanted
            .replace(/[^a-z0-9]+/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
          return wantedWords.length > 0 && wantedWords.every((word) => normalizedWords.includes(word));
        }
        return normalized.includes(wanted);
      }),
    );

    const sortField = filters?.[sortFieldKey];
    if (sortField && fields[sortField]) {
      const paths = String(fields[sortField]).split('|').filter(Boolean);
      const direction = String(filters?.[sortDirectionKey] || 'asc').toLowerCase();
      const multiplier = direction === 'desc' ? -1 : 1;
      result = [...result].sort((left: any, right: any) => {
        const a = this.firstValue(left, paths);
        const b = this.firstValue(right, paths);
        return this.compareValues(a, b, this.inferType(sortField, String(fields[sortField]))) * multiplier;
      });
    }

    return result;
  }

  /** Exposed for the toolbar's distinct-option list. */
  readFieldValue(item: any, fieldPaths: string): any {
    const paths = String(fieldPaths || '').split('|').filter(Boolean);
    const preferred = paths.filter((path) =>
      /fullName|displayLabel|_table|programName|roomName|classroomName|qualificationName|courseName|statusName|(^|\.)name$/i.test(path),
    );
    return this.firstValue(item, [...preferred, ...paths.filter((path) => !preferred.includes(path))]);
  }

  normalizeFieldValue(value: any): string {
    return this.normalizeValue(value);
  }

  private firstValue(item: any, paths: string[]): any {
    for (const path of paths) {
      const value = this.readValue(item, path);
      if (value !== null && value !== undefined && value !== '') return value;
    }
    return undefined;
  }

  private readValue(item: any, path: string): any {
    if (path === '@childLabel') {
      return this.personLabel(item, 'child');
    }
    if (path === '@parentLabel') {
      return this.personLabel(item, 'parent');
    }
    if (path === '@staffLabel') {
      return this.personLabel(item, 'staff');
    }
    if (path === '@classroomLabel') {
      const name = item?.displayLabel || item?.dropdownLabel || item?.roomName || item?.classroomName || item?.name || '';
      const code = item?.roomCode || item?.classroomCode || '';
      if (name && code && !String(name).toLowerCase().includes(String(code).toLowerCase())) {
        return `${name} · ${code}`;
      }
      return name || code || item?.id || '';
    }
    if (path === '@programLabel') {
      const name = item?.displayLabel || item?.dropdownLabel || item?.programName || item?.name || '';
      const code = item?.programCode || '';
      if (name && code && !String(name).toLowerCase().includes(String(code).toLowerCase())) {
        return `${name} · ${code}`;
      }
      return name || code || item?.id || '';
    }
    if (path === '@invoiceLabel') {
      return item?.displayLabel || item?.invoiceCode || item?.id || '';
    }
    if (path === '@parentName') {
      const parent = item?.child?.parent || item?.enrollment?.parent;
      return this.personLabel(parent, 'parent');
    }
    if (path === '@checkedInBy') return this.staffValue(item?.attendance?.checkedInBy);
    if (path === '@checkedOutBy') return this.staffValue(item?.attendance?.checkedOutBy);
    if (path === '@attendanceState') {
      if (item?.attendance?.checkOutTime) return 'Picked up';
      if (item?.attendance?.checkInTime) return 'In daycare';
      const status = item?.attendance?.status;
      const statusName = status?.name || status?.statusName || status;
      return String(statusName || '').toLowerCase() === 'absent' ? 'Absent' : 'Not arrived';
    }

    return path.split('.').reduce((value: any, key: string) => {
      if (value === null || value === undefined) return undefined;
      return value[key];
    }, item);
  }

  private personLabel(value: any, kind: 'child' | 'parent' | 'staff'): string {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'object') return String(value);

    const fullName = value.fullName || value.name ||
      [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
    const reference = kind === 'child'
      ? (value.childCode || (value.id != null ? `Child #${value.id}` : ''))
      : kind === 'parent'
        ? (value.parentCode || value.phone || (value.id != null ? `Parent #${value.id}` : ''))
        : (value.staffCode || value.login || (value.id != null ? `Staff #${value.id}` : ''));

    if (fullName && reference && !String(fullName).toLowerCase().includes(String(reference).toLowerCase())) {
      return `${fullName} · ${reference}`;
    }
    return String(fullName || reference || '');
  }

  private staffValue(value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'object') return value;
    return this.personLabel(value, 'staff');
  }

  private normalizeValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((item) => this.normalizeValue(item)).join(' ');
    if (typeof value === 'object') {
      const preferred =
        value.fullName || value.name || value.programName || value.roomName ||
        value.classroomName || value.qualificationName || value.courseName ||
        value.incidentType || value.mealType || value.statusName || value.login || value.id;
      return preferred !== undefined && preferred !== null ? String(preferred) : '';
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  private inferType(key: string, paths: string): 'text' | 'select' | 'date' | 'month' | 'time' | 'number' {
    const normalized = `${key} ${paths}`.toLowerCase();
    if (normalized.includes('billingmonth')) return 'month';
    const timeKeys = ['arrival', 'departure', 'sessionstart', 'sessionend', 'checkintime', 'checkouttime', 'checkin', 'checkout'];
    if (timeKeys.some((term) => normalized.includes(term)) || /(^|\.)time($|\|)/.test(normalized)) return 'time';
    if (normalized.includes('date') || normalized.includes('hiredate') || normalized.includes('billingmonth')) return 'date';
    const normalizedKey = key.toLowerCase();
    const numberKeys = ['amount', 'balance', 'fee', 'price', 'capacity', 'studentage', 'monthlyfee', 'received'];
    if (numberKeys.some((term) => normalizedKey === term || normalizedKey.endsWith(term))) return 'number';

    const categoryKeys = [
      'relationship', 'gender', 'bloodgroup', 'status', 'role', 'agegroup', 'floor',
      'classroom', 'program', 'course', 'qualification', 'type', 'method',
      'meal', 'atemeal', 'parentnotified', 'todaystatus', 'checkedinby',
      'checkedoutby', 'receivedby', 'paymentinvoice', 'attendanceclassroom', 'invoicechild', 'dashboardincidentchild',
    ];
    if (categoryKeys.some((term) => key.toLowerCase().includes(term))) return 'select';
    if ((key === 'parent' || key === 'child' || key === 'program' || key === 'classroom') && (paths.includes('.') || paths.includes('@parentName'))) return 'select';
    if (key.toLowerCase().includes('child') && paths.toLowerCase().includes('child.')) return 'select';
    return 'text';
  }

  private isEntitySelectField(key: string): boolean {
    const normalized = String(key || '').toLowerCase();
    return [
      'child', 'parent', 'staff', 'classroom', 'program', 'course',
      'qualification', 'teacher', 'invoice', 'receivedby', 'checkedinby',
      'checkedoutby', 'attendancechild', 'attendanceclassroom',
      'invoicechild', 'dashboardincidentchild', 'paymentinvoice',
    ].some((term) => normalized.includes(term));
  }

  private matchesRange(value: any, range: any, type: string): boolean {
    if (value === null || value === undefined || value === '') return false;
    const actual = this.rangeComparable(value, type);
    if (actual === null) return false;

    if (range?.mode === 'single') {
      const selected = this.isProvided(range?.value) ? this.rangeComparable(range.value, type, true) : null;
      return selected !== null && actual === selected;
    }

    const from = this.isProvided(range?.from) ? this.rangeComparable(range.from, type, true) : null;
    const to = this.isProvided(range?.to) ? this.rangeComparable(range.to, type, true) : null;
    if (from !== null && actual < from) return false;
    if (to !== null && actual > to) return false;
    return true;
  }

  private rangeComparable(value: any, type: string, isInput = false): number | null {
    if (type === 'number') {
      const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(numeric) ? numeric : null;
    }
    if (type === 'month') {
      const text = String(value).trim();
      const numericMonth = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (numericMonth) {
        const year = Number(numericMonth[1]);
        const month = Number(numericMonth[2]);
        return month >= 1 && month <= 12 ? year * 12 + month - 1 : null;
      }
      const labelMonth = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
      if (labelMonth) {
        const parsedMonth = new Date(`${labelMonth[1]} 1, ${labelMonth[2]}`);
        return Number.isNaN(parsedMonth.getTime())
          ? null
          : parsedMonth.getFullYear() * 12 + parsedMonth.getMonth();
      }
      const parsedDate = new Date(text);
      return Number.isNaN(parsedDate.getTime())
        ? null
        : parsedDate.getFullYear() * 12 + parsedDate.getMonth();
    }
    if (type === 'time') {
      const text = String(value).trim();
      const match = text.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
      if (!match) return null;
      let hour = Number(match[1]);
      const minute = Number(match[2]);
      const meridiem = (match[3] || '').toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      return hour * 60 + minute;
    }
    const text = String(value).trim();
    const dateText = isInput ? text : text.slice(0, 10);
    const timestamp = Date.parse(dateText);
    return Number.isNaN(timestamp) ? null : timestamp;
  }


  private isProvided(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private compareValues(a: any, b: any, type: string): number {
    if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
    if (b === null || b === undefined) return -1;
    if (['number', 'date', 'month', 'time'].includes(type)) {
      const left = this.rangeComparable(a, type);
      const right = this.rangeComparable(b, type);
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    }
    return this.normalizeValue(a).localeCompare(this.normalizeValue(b), undefined, { numeric: true, sensitivity: 'base' });
  }
}
