import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

// Mock requestAnimationFrame to run synchronously in test environment.
// Flushes React state updates after each rAF callback so tests see the new state.
let rafRunning = false;
let rafId = 0;

window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  const id = ++rafId;
  let ran = false;
  if (!rafRunning) {
    rafRunning = true;
    try {
      callback(0);
      ran = true;
    } finally {
      rafRunning = false;
    }
  }
  // Flush pending React state updates so tests see the effect of the rAF callback
  if (ran) {
    act(() => {});
  }
  return id;
};

window.cancelAnimationFrame = (_id: number): void => {
  // no-op: synchronous RAFs execute immediately and cannot be cancelled
};
