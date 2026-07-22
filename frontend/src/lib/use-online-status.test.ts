import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from './use-online-status';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true, writable: true });
}

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    setOnline(true);
  });

  it('arranca online', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.online).toBe(true);
  });

  it('pasa a offline al recibir el evento, tras el debounce', () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(600);
    });
    expect(result.current.online).toBe(false);
    expect(result.current.since).not.toBeNull();
  });

  it('vuelve a online al reconectar', () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(600);
    });
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
      vi.advanceTimersByTime(600);
    });
    expect(result.current.online).toBe(true);
  });
});
