import { Pipe, PipeTransform } from '@angular/core';

/** Slices the filtered and sorted table rows for the selected page. */
@Pipe({
  name: 'tablePaginate',
  standalone: false,
})
export class TablePaginatePipe implements PipeTransform {
  transform(
    items: any[] | null | undefined,
    page: number,
    pageSize: number,
  ): any[] {
    if (!Array.isArray(items)) {
      return [];
    }

    const safePage = Math.max(0, Math.floor(Number(page) || 0));
    const safePageSize = Math.max(1, Math.floor(Number(pageSize) || 5));
    const start = safePage * safePageSize;

    return items.slice(start, start + safePageSize);
  }
}
