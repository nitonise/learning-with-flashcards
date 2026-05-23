import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import type { ConfirmDialogData } from './confirm-dialog-data';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected readonly confirmLabel = this.data.confirmLabel ?? 'Confirm';
  protected readonly cancelLabel = this.data.cancelLabel ?? 'Cancel';
  protected readonly isDanger = this.data.tone === 'danger';
}
