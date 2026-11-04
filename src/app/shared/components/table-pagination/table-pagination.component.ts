import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

/** Reusable client-side pagination controls for an already filtered table. */
@Component({
  selector: 'app-table-pagination',
  standalone: false,
  templateUrl: './table-pagination.component.html',
  styleUrls: ['./table-pagination.component.scss'],
})
export class TablePaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() resetKey: any;

  page = 0;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  get totalPages(): number {
    const count = Math.max(0, Number(this.totalItems) || 0);
    return Math.ceil(count / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_value, index) => index);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey'] && !changes['resetKey'].firstChange) {
      this.page = 0;
      return;
    }

    if (changes['totalItems']) {
      const lastPage = Math.max(this.totalPages - 1, 0);
      if (this.page > lastPage) {
        this.page = lastPage;
      }
    }
  }

  goToPage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages || nextPage === this.page) {
      return;
    }
    this.page = nextPage;
  }

  changePageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nextSize = Number(select.value);
    if (
      !this.pageSizeOptions.includes(nextSize) ||
      nextSize === this.pageSize
    ) {
      return;
    }
    this.pageSize = nextSize;
    this.page = 0;
  }
}
