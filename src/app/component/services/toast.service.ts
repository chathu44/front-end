import { Injectable } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface AppToast {
  id: number;
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  toasts: AppToast[] = [];

  show(message: string, kind: ToastKind = 'info', ttlMs = 3500): void {
    const toast: AppToast = { id: ++this.seq, message, kind };
    this.toasts = [...this.toasts, toast];
    setTimeout(() => this.dismiss(toast.id), ttlMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 4500);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
