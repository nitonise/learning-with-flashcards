import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ToastService } from './toast';

describe('ToastService', () => {
  let snackBar: { open: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = {
      open: vi.fn(),
      dismiss: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows success messages with a polite snack bar', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('Deck saved.');

    expect(snackBar.open).toHaveBeenCalledWith('Deck saved.', 'Dismiss', {
      duration: 3200,
      horizontalPosition: 'end',
      panelClass: ['app-snack', 'app-snack--success'],
      politeness: 'polite',
      verticalPosition: 'bottom',
    });
  });

  it('shows warning messages assertively', () => {
    const toast = TestBed.inject(ToastService);

    toast.warning('Add a card first.');

    expect(snackBar.open).toHaveBeenCalledWith('Add a card first.', 'Dismiss', {
      duration: 3200,
      horizontalPosition: 'end',
      panelClass: ['app-snack', 'app-snack--warning'],
      politeness: 'assertive',
      verticalPosition: 'bottom',
    });
  });

  it('dismisses the current snack bar', () => {
    const toast = TestBed.inject(ToastService);

    toast.dismiss();

    expect(snackBar.dismiss).toHaveBeenCalled();
  });
});
