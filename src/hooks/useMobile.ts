import { useState, useEffect } from 'react';

export interface UseMobileResult {
  /** True when viewport width is less than 640px */
  isMobile: boolean;
  /** True when the primary pointing device is coarse (e.g. touch) */
  isTouch: boolean;
}

/**
 * Detects mobile viewport and touch capability via matchMedia.
 * Uses useState + useEffect — suitable for Vite SPAs without SSR.
 */
export function useMobile(): UseMobileResult {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );
  const [isTouch, setIsTouch] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mobileQuery = window.matchMedia('(max-width: 639px)');
    const touchQuery = window.matchMedia('(pointer: coarse)');

    const onMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const onTouchChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);

    mobileQuery.addEventListener('change', onMobileChange);
    touchQuery.addEventListener('change', onTouchChange);

    return () => {
      mobileQuery.removeEventListener('change', onMobileChange);
      touchQuery.removeEventListener('change', onTouchChange);
    };
  }, []);

  return { isMobile, isTouch };
}
