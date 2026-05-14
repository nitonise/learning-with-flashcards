import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog';

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
