import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('shows success messages', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('Deck saved.');

    expect(toast.message()).toEqual({
      id: 0,
      text: 'Deck saved.',
      tone: 'success',
    });
  });

  it('dismisses the current message', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('Deck created.');
    toast.dismiss();

    expect(toast.message()).toBeNull();
  });

  it('automatically clears the latest message', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('First message.');
    toast.success('Second message.');
    vi.advanceTimersByTime(3200);

    expect(toast.message()).toBeNull();
  });
});
