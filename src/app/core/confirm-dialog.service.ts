import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog-data';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        autoFocus: 'first-tabbable',
        data,
        panelClass: 'app-confirm-dialog-panel',
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
