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

  it('createFolder auto-suffixes sibling collisions case-insensitively', () => {
    const { result } = renderHook(() => useFileSystem());

    let firstId = '';
    let secondId = '';

    act(() => {
      result.current.navigate('C:');
      firstId = result.current.createFolder('C:', 'New Folder') ?? '';
      secondId = result.current.createFolder('C:', 'new folder') ?? '';
    });

    expect(firstId).toBe('C:\\New Folder');
    expect(secondId).toBe('C:\\new folder (2)');
  });

  it('renameNode rewrites descendant ids and dependent state', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:\\WINDOWS');
      result.current.navigate('C:\\WINDOWS\\system32');
      result.current.navigate('C:\\WINDOWS\\system32\\notepad.exe');
      result.current.setSelectedIds(['C:\\WINDOWS\\system32\\notepad.exe']);
    });

    let renamedId = '';
    act(() => {
      renamedId = result.current.renameNode('C:\\WINDOWS\\system32', 'System32') ?? '';
    });

    expect(renamedId).toBe('C:\\WINDOWS\\System32');
    expect(result.current.currentPath).toBe('C:\\WINDOWS\\System32\\notepad.exe');
    expect(result.current.selectedIds).toEqual(['C:\\WINDOWS\\System32\\notepad.exe']);
    expect(result.current.findNode('C:\\WINDOWS\\System32\\notepad.exe')).not.toBeNull();
  });

  it('deleteNodes prunes selected ids and falls back when current path is deleted', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
      result.current.navigate('C:\\WINDOWS');
      result.current.navigate('C:\\WINDOWS\\system32');
      result.current.navigate('C:\\WINDOWS\\system32\\calc.exe');
      result.current.setSelectedIds(['C:\\WINDOWS\\system32', 'C:\\WINDOWS\\system32\\calc.exe']);
    });

    act(() => {
      result.current.deleteNodes(['C:\\WINDOWS\\system32']);
    });

    expect(result.current.currentPath).toBe('C:\\WINDOWS');
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.findNode('C:\\WINDOWS\\system32')).toBeNull();
  });

  it('rejects duplicate sibling renames and destructive root mutations', () => {
    const { result } = renderHook(() => useFileSystem());

    const renameResult = result.current.renameNode('C:\\WINDOWS', 'Program Files');
    const deleteResult = result.current.deleteNodes(['C:']);

    expect(renameResult).toBeNull();
    expect(deleteResult).toBe(false);
    expect(result.current.findNode('C:\\WINDOWS')).not.toBeNull();
  });

  it('rejects invalid rename names with path separators', () => {
    const { result } = renderHook(() => useFileSystem());

    expect(result.current.renameNode('C:\\WINDOWS', 'bad/name')).toBeNull();
    expect(result.current.renameNode('C:\\WINDOWS', 'bad\\name')).toBeNull();
  });

  it('createFolder under my-computer becomes a child and appears in currentChildren', () => {
    const { result } = renderHook(() => useFileSystem());

    let newId = '';
    act(() => {
      newId = result.current.createFolder('my-computer', 'New Folder') ?? '';
    });

    expect(newId).toBe('New Folder');
    expect(result.current.currentChildren.map(node => node.id)).toContain('New Folder');
    expect(result.current.currentChildren.some(node => node.id === 'my-computer')).toBe(false);
  });

  it('renameNode uses the latest tree state after a prior mutation', () => {
    const { result } = renderHook(() => useFileSystem());

    let folderId = '';
    let renamedId = '';

    act(() => {
      result.current.navigate('C:');
      folderId = result.current.createFolder('C:', 'Scratch') ?? '';
      renamedId = result.current.renameNode(folderId, 'Renamed Scratch') ?? '';
    });

    expect(renamedId).toBe('C:\\Renamed Scratch');
    expect(result.current.findNode('C:\\Renamed Scratch')).not.toBeNull();
    expect(result.current.findNode('C:\\Scratch')).toBeNull();
  });

  it('deleteNodes keeps history aligned so back navigation still works after fallback', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
      result.current.navigate('C:\\WINDOWS');
      result.current.navigate('C:\\WINDOWS\\Temp');
      result.current.deleteNodes(['C:\\WINDOWS\\Temp']);
    });

    expect(result.current.currentPath).toBe('C:\\WINDOWS');

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentPath).toBe('C:');
  });

  it('copy sets clipboard flags without mutating the tree', () => {
    const { result } = renderHook(() => useFileSystem());

    const before = result.current.findNode('C:\\WINDOWS');

    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS']);
    });

    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardMode).toBe('copy');
    expect(result.current.findNode('C:\\WINDOWS')).toBe(before);
  });

  it('cut sets clipboard mode', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.cutToClipboard(['C:\\WINDOWS\\Temp']);
    });

    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardMode).toBe('cut');
  });

  it('cut on a drive is rejected safely', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.cutToClipboard(['C:']);
    });

    expect(result.current.hasClipboard).toBe(false);
    expect(result.current.clipboardMode).toBeNull();
  });

  it('rename rewrites clipboard ids by prefix so later paste still works', () => {
    const { result } = renderHook(() => useFileSystem());

    let renamedId = '';
    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS\\system32']);
      renamedId = result.current.renameNode('C:\\WINDOWS\\system32', 'System32') ?? '';
    });

    expect(renamedId).toBe('C:\\WINDOWS\\System32');
    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.findNode(renamedId)).not.toBeNull();

    let pasted = false;
    act(() => {
      pasted = result.current.paste('C:\\My Documents');
    });

    expect(pasted).toBe(true);

    expect(result.current.findNode('C:\\My Documents\\System32')).not.toBeNull();
    expect(result.current.findNode('C:\\My Documents\\System32\\notepad.exe')).not.toBeNull();
  });

  it('paste copy clones into a folder and keeps the original', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS\\system32']);
      result.current.paste('C:\\My Documents');
    });

    expect(result.current.findNode('C:\\WINDOWS\\system32')).not.toBeNull();
    expect(result.current.findNode('C:\\My Documents\\system32')).not.toBeNull();
    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardMode).toBe('copy');
  });

  it('paste into a file uses the parent folder', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS\\Temp']);
      result.current.paste('C:\\WINDOWS\\win.ini');
    });

    expect(result.current.findNode('C:\\WINDOWS\\Temp')).not.toBeNull();
    expect(result.current.findNode('C:\\WINDOWS\\Temp (2)')).not.toBeNull();
  });

  it('cut plus paste moves a folder and rewrites descendant ids', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.cutToClipboard(['C:\\WINDOWS\\system32']);
      result.current.paste('C:\\My Documents');
    });

    expect(result.current.findNode('C:\\WINDOWS\\system32')).toBeNull();
    expect(result.current.findNode('C:\\My Documents\\system32')).not.toBeNull();
    expect(result.current.findNode('C:\\My Documents\\system32\\notepad.exe')).not.toBeNull();
    expect(result.current.hasClipboard).toBe(false);
  });

  it('cut plus paste into a descendant is rejected safely', () => {
    const { result } = renderHook(() => useFileSystem());

    const before = result.current.findNode('C:\\WINDOWS\\system32');

    act(() => {
      result.current.cutToClipboard(['C:\\WINDOWS\\system32']);
      result.current.paste('C:\\WINDOWS\\system32\\notepad.exe');
    });

    expect(result.current.findNode('C:\\WINDOWS\\system32')).toBe(before);
    expect(result.current.findNode('C:\\WINDOWS\\system32\\notepad.exe')).not.toBeNull();
    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardMode).toBe('cut');
  });

  it('copy paste collision gets suffixed name case-insensitively', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS\\Temp']);
      result.current.paste('C:\\WINDOWS');
    });

    expect(result.current.findNode('C:\\WINDOWS\\Temp (2)')).not.toBeNull();
  });

  it('copy clipboard persists while cut clipboard clears after paste', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.copyToClipboard(['C:\\WINDOWS\\Temp']);
      result.current.paste('C:\\My Documents');
    });

    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardMode).toBe('copy');

    act(() => {
      result.current.cutToClipboard(['C:\\WINDOWS\\Cookies']);
      result.current.paste('C:\\My Documents');
    });

    expect(result.current.hasClipboard).toBe(false);
    expect(result.current.clipboardMode).toBeNull();
  });

  it('goForward keeps the current path ref in sync for later mutations', () => {
    const { result } = renderHook(() => useFileSystem());

    act(() => {
      result.current.navigate('C:');
      result.current.navigate('C:\\WINDOWS');
      result.current.navigate('C:\\WINDOWS\\system32');
      result.current.navigate('C:\\WINDOWS\\system32\\notepad.exe');
      result.current.goBack();
      result.current.goForward();
      result.current.goUp();
    });

    expect(result.current.currentPath).toBe('C:\\WINDOWS\\system32');
  });

});
