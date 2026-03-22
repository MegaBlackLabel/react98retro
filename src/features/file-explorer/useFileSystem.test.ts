import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FS, useFileSystem } from './useFileSystem';

describe('useFileSystem', () => {
  it('initializes with my-computer as the current path', () => {
    const { result } = renderHook(() => useFileSystem());
    expect(result.current.currentPath).toBe('my-computer');
  });

  it('navigate changes currentPath', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
    });

    expect(result.current.currentPath).toBe('C:');
  });

  it('goBack returns to previous path', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
      result.current.navigate('C:\\WINDOWS');
      result.current.goBack();
    });

    expect(result.current.currentPath).toBe('C:');
  });

  it('goForward goes forward after goBack', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
      result.current.navigate('C:\\WINDOWS');
      result.current.goBack();
      result.current.goForward();
    });

    expect(result.current.currentPath).toBe('C:\\WINDOWS');
  });

  it('goUp navigates to parent', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:\\WINDOWS\\system32');
    });

    act(() => {
      result.current.goUp();
    });

    expect(result.current.currentPath).toBe('C:\\WINDOWS');
  });

  it('exposes correct navigation flags', () => {
    const { result } = renderHook(() => useFileSystem());

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);

    act(() => {
      result.current.navigate('C:');
    });

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it('returns children for the current node', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
    });

    expect(result.current.currentChildren.map(node => node.id)).toEqual([
      'C:\\My Documents',
      'C:\\Program Files',
      'C:\\WINDOWS',
      'C:\\Autoexec.bat',
      'C:\\Config.sys',
    ]);
  });

  it('getDisplayPath returns the node id', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:\\WINDOWS');
    });

    expect(result.current.getDisplayPath()).toBe('C:\\WINDOWS');
  });

  it('uses the default file system tree', () => {
    expect(DEFAULT_FS[0]?.id).toBe('my-computer');
  });
});
