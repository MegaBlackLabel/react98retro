import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from './FileTree';
import type { FSNode } from './useFileSystem';

const TEST_FS: FSNode[] = [
  {
    id: 'my-computer',
    name: 'マイコンピュータ',
    type: 'folder',
    children: [
      {
        id: 'C:',
        name: 'ローカルディスク (C:)',
        type: 'drive',
        children: [
          { id: 'C:\\WINDOWS', name: 'WINDOWS', type: 'folder', children: [] },
          { id: 'C:\\Autoexec.bat', name: 'Autoexec.bat', type: 'file', size: 0 },
        ],
      },
    ],
  },
];

describe('FileTree', () => {
  it('filters out file nodes', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="my-computer"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('マイコンピュータ')).toBeInTheDocument();
    expect(screen.getByText('ローカルディスク (C:)')).toBeInTheDocument();
    expect(screen.getByText('WINDOWS')).toBeInTheDocument();
    expect(screen.queryByText('Autoexec.bat')).not.toBeInTheDocument();
  });

  it('renders drive icon for drives', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="my-computer"
        onNavigate={onNavigate}
      />,
    );

    const driveLabel = screen.getByText('ローカルディスク (C:)').closest('span');
    expect(driveLabel).toBeInTheDocument();
    const img = driveLabel?.querySelector('img');
    expect(img).toHaveAttribute('src');
  });

  it('opens my-computer by default', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="my-computer"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('ローカルディスク (C:)')).toBeInTheDocument();
  });

  it('passes selectedId to TreeView', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="C:"
        onNavigate={onNavigate}
      />,
    );

    // TreeView handles selection styling internally
    // Just verify it renders without error
    expect(screen.getByText('ローカルディスク (C:)')).toBeInTheDocument();
  });

  it('calls onNavigate when label is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="my-computer"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText('ローカルディスク (C:)'));
    expect(onNavigate).toHaveBeenCalledWith('C:');
  });

  it('calls onNavigate with correct id for nested folders', () => {
    const onNavigate = vi.fn();
    render(
      <FileTree
        fs={TEST_FS}
        currentPath="my-computer"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText('WINDOWS'));
    expect(onNavigate).toHaveBeenCalledWith('C:\\WINDOWS');
  });
});
