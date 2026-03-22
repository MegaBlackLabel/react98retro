import { useCallback, useState } from 'react';

export type FileType = 'drive' | 'folder' | 'file';

export type FSNode = {
  id: string;
  name: string;
  type: FileType;
  icon?: string;
  children?: FSNode[];
  size?: number;
  modified?: Date;
  fileExt?: string;
};

export const DEFAULT_FS: FSNode[] = [
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
          {
            id: 'C:\\My Documents',
            name: 'My Documents',
            type: 'folder',
            children: [
              {
                id: 'C:\\My Documents\\document.txt',
                name: 'document.txt',
                type: 'file',
                size: 1024,
                fileExt: 'txt',
                modified: new Date('2000-09-13'),
              },
            ],
          },
          {
            id: 'C:\\Program Files',
            name: 'Program Files',
            type: 'folder',
            children: [
              {
                id: 'C:\\Program Files\\Internet Explorer',
                name: 'Internet Explorer',
                type: 'folder',
                children: [
                  {
                    id: 'C:\\Program Files\\Internet Explorer\\IEXPLORE.EXE',
                    name: 'IEXPLORE.EXE',
                    type: 'file',
                    size: 90112,
                    fileExt: 'exe',
                    modified: new Date('1999-04-23'),
                  },
                ],
              },
            ],
          },
          {
            id: 'C:\\WINDOWS',
            name: 'WINDOWS',
            type: 'folder',
            children: [
              { id: 'C:\\WINDOWS\\system32', name: 'system32', type: 'folder', modified: new Date('1999-04-23'), children: [
                { id: 'C:\\WINDOWS\\system32\\notepad.exe', name: 'notepad.exe', type: 'file', size: 69120, fileExt: 'exe', modified: new Date('1999-04-23') },
                { id: 'C:\\WINDOWS\\system32\\calc.exe', name: 'calc.exe', type: 'file', size: 114688, fileExt: 'exe', modified: new Date('1999-04-23') },
                { id: 'C:\\WINDOWS\\system32\\mspaint.exe', name: 'mspaint.exe', type: 'file', size: 188416, fileExt: 'exe', modified: new Date('1999-04-23') },
              ]},
              { id: 'C:\\WINDOWS\\Temp', name: 'Temp', type: 'folder', modified: new Date('1999-04-23'), children: [] },
              { id: 'C:\\WINDOWS\\Fonts', name: 'Fonts', type: 'folder', modified: new Date('1999-04-23'), children: [] },
              { id: 'C:\\WINDOWS\\Help', name: 'Help', type: 'folder', modified: new Date('1999-04-23'), children: [] },
              { id: 'C:\\WINDOWS\\Media', name: 'Media', type: 'folder', modified: new Date('1999-04-23'), children: [] },
              { id: 'C:\\WINDOWS\\Cookies', name: 'Cookies', type: 'folder', modified: new Date('2000-08-13'), children: [] },
              { id: 'C:\\WINDOWS\\History', name: 'History', type: 'folder', modified: new Date('2000-09-13'), children: [] },
              { id: 'C:\\WINDOWS\\Temporary Internet Files', name: 'Temporary Internet Files', type: 'folder', modified: new Date('2000-09-13'), children: [] },
              { id: 'C:\\WINDOWS\\Desktop', name: 'Desktop', type: 'folder', modified: new Date('2000-08-13'), children: [] },
              { id: 'C:\\WINDOWS\\Start Menu', name: 'Start Menu', type: 'folder', modified: new Date('2000-08-13'), children: [] },
              { id: 'C:\\WINDOWS\\win.ini', name: 'win.ini', type: 'file', size: 512, fileExt: 'ini', modified: new Date('1999-04-23') },
              { id: 'C:\\WINDOWS\\system.ini', name: 'system.ini', type: 'file', size: 256, fileExt: 'ini', modified: new Date('1999-04-23') },
              { id: 'C:\\WINDOWS\\explorer.exe', name: 'explorer.exe', type: 'file', size: 175104, fileExt: 'exe', modified: new Date('1999-04-23') },
              { id: 'C:\\WINDOWS\\regedit.exe', name: 'regedit.exe', type: 'file', size: 120832, fileExt: 'exe', modified: new Date('1999-04-23') },
              { id: 'C:\\WINDOWS\\NOTEPAD.EXE', name: 'NOTEPAD.EXE', type: 'file', size: 69120, fileExt: 'exe', modified: new Date('1999-04-23') },
            ],
          },
          {
            id: 'C:\\Autoexec.bat',
            name: 'Autoexec.bat',
            type: 'file',
            size: 128,
            fileExt: 'bat',
            modified: new Date('1999-04-23'),
          },
          {
            id: 'C:\\Config.sys',
            name: 'Config.sys',
            type: 'file',
            size: 64,
            fileExt: 'sys',
            modified: new Date('1999-04-23'),
          },
        ],
      },
      {
        id: 'A:',
        name: '3.5 インチ FD (A:)',
        type: 'drive',
        children: [],
      },
    ],
  },
];

export type NavigationHistory = {
  paths: string[];
  currentIndex: number;
};

function findNodeById(id: string, nodes: FSNode[]): FSNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function findParentNode(targetId: string, nodes: FSNode[], parent: FSNode | null = null): FSNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return parent;
    }
    if (node.children) {
      const found = findParentNode(targetId, node.children, node);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function useFileSystem(initialFs: FSNode[] = DEFAULT_FS) {
  const [fs] = useState<FSNode[]>(initialFs);
  const [currentPath, setCurrentPath] = useState<string>('my-computer');
  const [history, setHistory] = useState<NavigationHistory>({
    paths: ['my-computer'],
    currentIndex: 0,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const findNode = useCallback((id: string, nodes: FSNode[] = fs): FSNode | null => {
    return findNodeById(id, nodes);
  }, [fs]);

  const currentNode = findNode(currentPath);
  const currentChildren: FSNode[] = currentNode?.children ?? [];

  const navigate = useCallback((id: string) => {
    const node = findNode(id);
    if (!node) {
      return;
    }

    setCurrentPath(id);
    setSelectedIds([]);
    setHistory(prev => ({
      paths: [...prev.paths.slice(0, prev.currentIndex + 1), id],
      currentIndex: prev.currentIndex + 1,
    }));
  }, [findNode]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex <= 0) {
        return prev;
      }

      const newIndex = prev.currentIndex - 1;
      setCurrentPath(prev.paths[newIndex]);
      setSelectedIds([]);
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  const goForward = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex >= prev.paths.length - 1) {
        return prev;
      }

      const newIndex = prev.currentIndex + 1;
      setCurrentPath(prev.paths[newIndex]);
      setSelectedIds([]);
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  const goUp = useCallback(() => {
    const parent = findParentNode(currentPath, fs);
    if (parent) {
      navigate(parent.id);
    }
  }, [currentPath, fs, navigate]);

  const getDisplayPath = useCallback((): string => {
    const node = findNode(currentPath);
    if (!node) return currentPath;
    if (node.id === 'my-computer') return 'マイコンピュータ';
    return node.id;
  }, [currentPath, findNode]);

  const canGoBack = history.currentIndex > 0;
  const canGoForward = history.currentIndex < history.paths.length - 1;
  const canGoUp = currentPath !== 'my-computer';

  return {
    fs,
    currentPath,
    currentNode,
    currentChildren,
    selectedIds,
    setSelectedIds,
    navigate,
    goBack,
    goForward,
    goUp,
    canGoBack,
    canGoForward,
    canGoUp,
    getDisplayPath,
    findNode,
  };
}
