import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type ToastTone = 'success' | 'warning';

const TOAST_DURATION = 3200;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(text: string): void {
    this.show(text, 'success');
  }

  warning(text: string): void {
    this.show(text, 'warning');
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }

  private show(text: string, tone: ToastTone): void {
    this.snackBar.open(text, 'Dismiss', {
      duration: TOAST_DURATION,
      horizontalPosition: 'end',
      panelClass: ['app-snack', `app-snack--${tone}`],
      politeness: tone === 'warning' ? 'assertive' : 'polite',
      verticalPosition: 'bottom',
    });
  }
}
