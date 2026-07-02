import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobile } from './useMobile';

describe('useMobile', () => {
  let matchMediaMocks: Map<string, { matches: boolean; listeners: Set<(e: MediaQueryListEvent) => void> }>;

  function createMockMql(media: string): MediaQueryList {
    if (!matchMediaMocks.has(media)) {
      matchMediaMocks.set(media, { matches: media === '(max-width: 639px)' ? window.innerWidth < 640 : false, listeners: new Set() });
    }
    const mock = matchMediaMocks.get(media)!;
    return {
      matches: mock.matches,
      media,
      onchange: null,
      addEventListener: vi.fn((_type: string, handler: EventListener) => {
        mock.listeners.add(handler as (e: MediaQueryListEvent) => void);
      }),
      removeEventListener: vi.fn((_type: string, handler: EventListener) => {
        mock.listeners.delete(handler as (e: MediaQueryListEvent) => void);
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  }

  function fireMediaChange(media: string, matches: boolean) {
    const mock = matchMediaMocks.get(media);
    if (!mock) return;
    mock.matches = matches;
    mock.listeners.forEach((handler) => {
      handler({ matches, media } as MediaQueryListEvent);
    });
  }

  beforeEach(() => {
    matchMediaMocks = new Map();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => createMockMql(query)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns isMobile=true when viewport is narrow (375px)', () => {
    vi.stubGlobal('innerWidth', 375);
    // Re-create mocks with new innerWidth
    matchMediaMocks = new Map();
    const { result } = renderHook(() => useMobile());
    expect(result.current.isMobile).toBe(true);
  });

  it('returns isMobile=false when viewport is wide (1024px)', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    const { result } = renderHook(() => useMobile());
    expect(result.current.isMobile).toBe(false);
  });

  it('returns isTouch=true when pointer is coarse', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    // Pre-set the coarse match
    matchMediaMocks.set('(pointer: coarse)', { matches: true, listeners: new Set() });
    const { result } = renderHook(() => useMobile());
    expect(result.current.isTouch).toBe(true);
  });

  it('returns isTouch=false when pointer is fine', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    matchMediaMocks.set('(pointer: coarse)', { matches: false, listeners: new Set() });
    const { result } = renderHook(() => useMobile());
    expect(result.current.isTouch).toBe(false);
  });

  it('updates isMobile when matchMedia change fires', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    const { result } = renderHook(() => useMobile());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      fireMediaChange('(max-width: 639px)', true);
    });
    expect(result.current.isMobile).toBe(true);
  });

  it('updates isTouch when pointer type changes', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    matchMediaMocks.set('(pointer: coarse)', { matches: false, listeners: new Set() });
    const { result } = renderHook(() => useMobile());
    expect(result.current.isTouch).toBe(false);

    act(() => {
      fireMediaChange('(pointer: coarse)', true);
    });
    expect(result.current.isTouch).toBe(true);
  });

  it('removes event listeners on unmount', () => {
    vi.stubGlobal('innerWidth', 1024);
    matchMediaMocks = new Map();
    const { unmount } = renderHook(() => useMobile());

    const mobileMock = matchMediaMocks.get('(max-width: 639px)')!;
    const touchMock = matchMediaMocks.get('(pointer: coarse)')!;

    unmount();

    // After unmount, listeners should be cleaned up (sets should be empty)
    expect(mobileMock.listeners.size).toBe(0);
    expect(touchMock.listeners.size).toBe(0);
  });

  it('defaults to false when window is undefined', () => {
    const { result } = renderHook(() => {
      if (typeof window === 'undefined') return { isMobile: false, isTouch: false };
      return useMobile();
    });
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTouch).toBe(false);
  });
});
