import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

// Mock requestAnimationFrame to run synchronously in test environment.
// Uses a queue to handle re-entrant scheduling (callbacks that call rAF
// from within another rAF callback are queued and flushed after the current
// callback completes).  cancelAnimationFrame removes from the queue when
// the id is still pending.
let rafQueue: { id: number; callback: FrameRequestCallback }[] = [];
let rafId = 0;
let rafFlushing = false;

window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  const id = ++rafId;
  rafQueue.push({ id, callback });
  if (!rafFlushing) {
    rafFlushing = true;
    try {
      while (rafQueue.length > 0) {
        const entry = rafQueue.shift()!;
        entry.callback(0);
        // Flush React state updates after each callback
        act(() => {});
      }
    } finally {
      rafFlushing = false;
      rafQueue = [];
    }
  }
  return id;
};

window.cancelAnimationFrame = (id: number): void => {
  rafQueue = rafQueue.filter((e) => e.id !== id);
};
