import { Injectable, signal } from '@angular/core';

type ToastTone = 'success' | 'warning';

interface ToastMessage {
  readonly id: number;
  readonly text: string;
  readonly tone: ToastTone;
}

const TOAST_DURATION = 3200;

interface UnrefableTimer {
  unref(): void;
}

function unrefTimerIfPossible(value: ReturnType<typeof setTimeout>): void {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  const candidate = value as { readonly unref?: unknown };
  if (typeof candidate.unref === 'function') {
    (candidate as UnrefableTimer).unref();
  }
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private dismissHandle: ReturnType<typeof setTimeout> | undefined;
  private nextId = 0;
  private readonly messageState = signal<ToastMessage | null>(null);

  readonly message = this.messageState.asReadonly();

  success(text: string): void {
    this.show(text, 'success');
  }

  warning(text: string): void {
    this.show(text, 'warning');
  }

  dismiss(): void {
    this.clearDismissHandle();
    this.messageState.set(null);
  }

  private show(text: string, tone: ToastTone): void {
    this.clearDismissHandle();
    this.messageState.set({
      id: this.nextId++,
      text,
      tone,
    });
    this.dismissHandle = setTimeout(() => this.messageState.set(null), TOAST_DURATION);

    unrefTimerIfPossible(this.dismissHandle);
  }

  private clearDismissHandle(): void {
    if (this.dismissHandle === undefined) {
      return;
    }

    clearTimeout(this.dismissHandle);
    this.dismissHandle = undefined;
  }
}
