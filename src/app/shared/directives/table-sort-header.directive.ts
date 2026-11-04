import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

/** Adds accessible click-to-sort behaviour to a table heading. */
@Directive({
  selector: 'th[appTableSort]',
})
export class TableSortHeaderDirective {
  @Input('appTableSort') fieldKey = '';
  @Input() sortFilters: { [key: string]: any } = {};
  @Input() sortFieldKey = '$sortField';
  @Input() sortDirectionKey = '$sortDirection';
  @Output() sortFiltersChange = new EventEmitter<{ [key: string]: any }>();

  @HostBinding('class.table-sortable-header') sortable = true;
  @HostBinding('class.sort-ascending') get isAscending(): boolean {
    return this.isCurrentSort && this.currentDirection === 'asc';
  }
  @HostBinding('class.sort-descending') get isDescending(): boolean {
    return this.isCurrentSort && this.currentDirection === 'desc';
  }
  @HostBinding('attr.aria-sort') get ariaSort():
    | 'ascending'
    | 'descending'
    | 'none' {
    if (!this.isCurrentSort) return 'none';
    return this.currentDirection === 'desc' ? 'descending' : 'ascending';
  }
  @HostBinding('attr.tabindex') tabIndex = 0;
  @HostBinding('attr.title') get titleText(): string {
    return 'Sort by ' + (this.fieldKey || 'this column');
  }

  private get isCurrentSort(): boolean {
    return (
      Boolean(this.fieldKey) &&
      this.sortFilters?.[this.sortFieldKey] === this.fieldKey
    );
  }

  private get currentDirection(): string {
    return String(
      this.sortFilters?.[this.sortDirectionKey] || 'asc',
    ).toLowerCase();
  }

  @HostListener('click')
  onClick(): void {
    this.toggleSort();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSort();
    }
  }

  private toggleSort(): void {
    if (!this.fieldKey) return;

    const next = { ...(this.sortFilters || {}) };
    const isSameColumn = next[this.sortFieldKey] === this.fieldKey;
    next[this.sortFieldKey] = this.fieldKey;
    next[this.sortDirectionKey] =
      isSameColumn && this.currentDirection === 'asc' ? 'desc' : 'asc';
    this.sortFilters = next;
    this.sortFiltersChange.emit(next);
  }
}
