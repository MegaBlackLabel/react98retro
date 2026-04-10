import { useCallback, useRef, useState } from 'react';

export type FileType = 'drive' | 'folder' | 'file';

export type ViewMode = 'largeIcons' | 'smallIcons' | 'list' | 'details';

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
              {
                id: 'C:\\WINDOWS\\system32',
                name: 'system32',
                type: 'folder',
                modified: new Date('1999-04-23'),
                children: [
                  {
                    id: 'C:\\WINDOWS\\system32\\notepad.exe',
                    name: 'notepad.exe',
                    type: 'file',
                    size: 69120,
                    fileExt: 'exe',
                    modified: new Date('1999-04-23'),
                  },
                  {
                    id: 'C:\\WINDOWS\\system32\\calc.exe',
                    name: 'calc.exe',
                    type: 'file',
                    size: 114688,
                    fileExt: 'exe',
                    modified: new Date('1999-04-23'),
                  },
                  {
                    id: 'C:\\WINDOWS\\system32\\mspaint.exe',
                    name: 'mspaint.exe',
                    type: 'file',
                    size: 188416,
                    fileExt: 'exe',
                    modified: new Date('1999-04-23'),
                  },
                ],
              },
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

type PathUpdate = {
  oldPrefix: string;
  newPrefix: string;
};

type ClipboardMode = 'copy' | 'cut';

function normalizeName(name: string): string {
  return name.toLowerCase();
}

function hasPathSeparator(name: string): boolean {
  return name.includes('\\') || name.includes('/');
}

function joinPath(parentId: string, name: string): string {
  if (parentId === 'my-computer') return name;
  return parentId.endsWith('\\') ? `${parentId}${name}` : `${parentId}\\${name}`;
}

function getParentId(id: string): string | null {
  if (id === 'my-computer' || /^[A-Za-z]:$/.test(id)) return null;
  const index = id.lastIndexOf('\\');
  return index === -1 ? null : id.slice(0, index);
}

function findNodeById(id: string, nodes: FSNode[]): FSNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

function findNodeEntry(id: string, nodes: FSNode[], parent: FSNode | null = null): { node: FSNode; parent: FSNode | null } | null {
  for (const node of nodes) {
    if (node.id === id) return { node, parent };
    if (node.children) {
      const found = findNodeEntry(id, node.children, node);
      if (found) return found;
    }
  }
  return null;
}


function replaceNode(nodes: FSNode[], targetId: string, nextNode: FSNode): FSNode[] {
  return nodes.map(node => {
    if (node.id === targetId) return nextNode;
    if (node.children) return { ...node, children: replaceNode(node.children, targetId, nextNode) };
    return node;
  });
}

function removeNodes(nodes: FSNode[], ids: Set<string>): FSNode[] {
  return nodes
    .filter(node => !ids.has(node.id))
    .map(node => ({ ...node, children: node.children ? removeNodes(node.children, ids) : node.children }));
}

function rewriteIds(node: FSNode, oldPrefix: string, newPrefix: string): FSNode {
  const nextId = node.id === oldPrefix ? newPrefix : `${newPrefix}${node.id.slice(oldPrefix.length)}`;
  return { ...node, id: nextId, children: node.children?.map(child => rewriteIds(child, oldPrefix, newPrefix)) };
}

function rewritePath(value: string, updates: PathUpdate[]): string {
  for (const update of updates) {
    if (value === update.oldPrefix || value.startsWith(`${update.oldPrefix}\\`)) {
      return `${update.newPrefix}${value.slice(update.oldPrefix.length)}`;
    }
  }
  return value;
}

function rewritePaths(values: string[], updates: PathUpdate[]): string[] {
  return values.map(value => rewritePath(value, updates));
}

function isDescendant(path: string, ancestor: string): boolean {
  return path.startsWith(`${ancestor}\\`);
}

function isNameTaken(nodes: FSNode[], name: string, ignoreId?: string): boolean {
  const normalized = normalizeName(name);
  return nodes.some(node => node.id !== ignoreId && normalizeName(node.name) === normalized);
}

function resolveUniqueName(nodes: FSNode[], name: string): string {
  let candidate = name;
  let suffix = 2;
  while (isNameTaken(nodes, candidate)) {
    candidate = `${name} (${suffix})`;
    suffix += 1;
  }
  return candidate;
}

function deepestFirst(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => b.length - a.length);
}

function prunePaths(paths: string[], deletedIds: Set<string>): string[] {
  return paths.filter(path => ![...deletedIds].some(deleted => path === deleted || isDescendant(path, deleted)));
}

function nearestSurvivingAncestor(path: string, deletedIds: Set<string>, findNode: (id: string) => FSNode | null): string {
  let current: string | null = path;
  while (current) {
    const candidate = current;
    const blockedByDeletedAncestor = [...deletedIds].some(deleted => candidate === deleted || isDescendant(candidate, deleted));
    if (!blockedByDeletedAncestor && findNode(candidate)) return candidate;
    current = getParentId(candidate);
  }
  return 'my-computer';
}

function hasBlockedTarget(ids: string[]): boolean {
  return ids.some(id => id === 'my-computer' || /^[A-Za-z]:$/.test(id));
}

function pruneClipboardIds(ids: string[], deletedIds: Set<string>): string[] {
  return ids.filter(id => ![...deletedIds].some(deleted => id === deleted || isDescendant(id, deleted)));
}

function topLevelIds(ids: string[]): string[] {
  const uniqueIds = [...new Set(ids)];
  return uniqueIds.filter(id => !uniqueIds.some(other => other !== id && isDescendant(id, other)));
}

function getPasteTarget(targetId: string, findNode: (id: string) => FSNode | null): { containerId: string; container: FSNode } | null {
  const node = findNode(targetId);
  if (!node) return null;
  if (node.type === 'file') {
    const parentId = getParentId(node.id);
    if (!parentId) return null;
    const parent = findNode(parentId);
    if (!parent || parent.type === 'file') return null;
    return { containerId: parent.id, container: parent };
  }
  return { containerId: node.id, container: node };
}

function resolvePasteSources(ids: string[], findNode: (id: string) => FSNode | null): FSNode[] | null {
  const roots = topLevelIds(ids);
  const nodes = roots.map(id => findNode(id));
  if (nodes.some(node => !node)) return null;
  return nodes as FSNode[];
}

export function useFileSystem(initialFs: FSNode[] = DEFAULT_FS) {
  const [fs, setFs] = useState<FSNode[]>(initialFs);
  const fsRef = useRef(fs);
  const [currentPath, setCurrentPath] = useState('my-computer');
  const currentPathRef = useRef('my-computer');
  const [history, setHistory] = useState<NavigationHistory>({ paths: ['my-computer'], currentIndex: 0 });
  const historyRef = useRef<NavigationHistory>({ paths: ['my-computer'], currentIndex: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboardIds, setClipboardIds] = useState<string[]>([]);
  const clipboardIdsRef = useRef<string[]>([]);
  const [clipboardMode, setClipboardMode] = useState<ClipboardMode | null>(null);
  const clipboardModeRef = useRef<ClipboardMode | null>(null);

  const findNode = useCallback((id: string, nodes: FSNode[] = fsRef.current): FSNode | null => findNodeById(id, nodes), []);
  const currentNode = findNode(currentPath);
  const currentChildren = currentNode?.children ?? [];

  const navigate = useCallback((id: string) => {
    const node = findNode(id);
    if (!node) return;
    currentPathRef.current = id;
    setCurrentPath(id);
    setSelectedIds([]);
    const nextHistory = {
      paths: [...historyRef.current.paths.slice(0, historyRef.current.currentIndex + 1), id],
      currentIndex: historyRef.current.currentIndex + 1,
    };
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  }, [findNode]);

  const goBack = useCallback(() => {
    const prev = historyRef.current;
    if (prev.currentIndex <= 0) return;
    const newIndex = prev.currentIndex - 1;
    const nextHistory = { ...prev, currentIndex: newIndex };
    historyRef.current = nextHistory;
    currentPathRef.current = prev.paths[newIndex];
    setCurrentPath(prev.paths[newIndex]);
    setSelectedIds([]);
    setHistory(nextHistory);
  }, []);

  const goForward = useCallback(() => {
    const prev = historyRef.current;
    if (prev.currentIndex >= prev.paths.length - 1) return;
    const newIndex = prev.currentIndex + 1;
    const nextHistory = { ...prev, currentIndex: newIndex };
    historyRef.current = nextHistory;
    currentPathRef.current = prev.paths[newIndex];
    setCurrentPath(prev.paths[newIndex]);
    setSelectedIds([]);
    setHistory(nextHistory);
  }, []);

  const goUp = useCallback(() => {
    const parent = findNode(currentPathRef.current)?.id ? getParentId(currentPathRef.current) : null;
    if (parent) navigate(parent);
  }, [currentPath, findNode, navigate]);

  const createFolder = useCallback((parentId: string, name: string) => {
    const parent = findNode(parentId);
    if (!parent || parent.type === 'file') return null;

    const prev = fsRef.current;
    const parentNode = findNodeById(parentId, prev);
    if (!parentNode || parentNode.type === 'file') return null;

    const siblings = parentNode.children ?? [];
    const finalName = resolveUniqueName(siblings, name);
    const newId = joinPath(parentId, finalName);
    const newNode: FSNode = { id: newId, name: finalName, type: 'folder', children: [] };
    const nextFs = replaceNode(prev, parentId, { ...parentNode, children: [...siblings, newNode] });

    fsRef.current = nextFs;
    setFs(nextFs);
    return newId;
  }, [findNode]);

  const deleteNodes = useCallback((ids: string[]) => {
    const targets = deepestFirst(ids);
    if (hasBlockedTarget(targets)) return false;

    const deletedIds = new Set(targets);
    const nextCurrentPath = nearestSurvivingAncestor(currentPathRef.current, deletedIds, findNode);

    const nextFs = removeNodes(fsRef.current, deletedIds);
    fsRef.current = nextFs;
    setFs(nextFs);
    setSelectedIds(prev => prev.filter(id => ![...deletedIds].some(deleted => id === deleted || isDescendant(id, deleted))));
    const paths = prunePaths(historyRef.current.paths, deletedIds);
    const currentIndex = Math.max(0, paths.lastIndexOf(nextCurrentPath));
    const nextHistory = { paths, currentIndex };
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    currentPathRef.current = nextCurrentPath;
    setCurrentPath(nextCurrentPath);

    const nextClipboardIds = pruneClipboardIds(clipboardIdsRef.current, deletedIds);
    clipboardIdsRef.current = nextClipboardIds;
    setClipboardIds(nextClipboardIds);
    if (nextClipboardIds.length === 0) {
      clipboardModeRef.current = null;
      setClipboardMode(null);
    }
    return true;
  }, [findNode]);

  const renameNode = useCallback((id: string, newName: string) => {
    if (id === 'my-computer' || /^[A-Za-z]:$/.test(id)) return null;
    if (!newName || hasPathSeparator(newName)) return null;

    const entry = findNodeEntry(id, fsRef.current);
    if (!entry || !entry.parent) return null;

    const siblings = entry.parent.children ?? [];
    if (isNameTaken(siblings, newName, id)) return null;

    const newId = joinPath(entry.parent.id, newName);
    const rewritten = { ...rewriteIds(entry.node, id, newId), name: newName };
    const updates: PathUpdate[] = [{ oldPrefix: id, newPrefix: newId }];

    const nextFs = replaceNode(fsRef.current, id, rewritten);
    fsRef.current = nextFs;
    setFs(nextFs);

    const nextCurrentPath = rewritePath(currentPathRef.current, updates);
    currentPathRef.current = nextCurrentPath;
    setCurrentPath(nextCurrentPath);
    const nextHistory = { ...historyRef.current, paths: rewritePaths(historyRef.current.paths, updates) };
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setSelectedIds(prev => rewritePaths(prev, updates));

    const nextClipboardIds = rewritePaths(clipboardIdsRef.current, updates);
    clipboardIdsRef.current = nextClipboardIds;
    setClipboardIds(nextClipboardIds);
    setClipboardMode(clipboardModeRef.current);
    return newId;
  }, []);

  const copyToClipboard = useCallback((ids: string[]) => {
    const roots = topLevelIds(ids);
    clipboardIdsRef.current = roots;
    clipboardModeRef.current = roots.length > 0 ? 'copy' : null;
    setClipboardIds(roots);
    setClipboardMode(clipboardModeRef.current);
  }, []);

  const cutToClipboard = useCallback((ids: string[]) => {
    const roots = topLevelIds(ids);
    if (roots.length === 0 || hasBlockedTarget(roots)) {
      clipboardIdsRef.current = [];
      clipboardModeRef.current = null;
      setClipboardIds([]);
      setClipboardMode(null);
      return false;
    }

    clipboardIdsRef.current = roots;
    clipboardModeRef.current = 'cut';
    setClipboardIds(roots);
    setClipboardMode('cut');
    return true;
  }, []);

  const paste = useCallback((targetId: string) => {
    const mode = clipboardModeRef.current;
    const ids = clipboardIdsRef.current;
    if (!mode || ids.length === 0) return false;

    const sourceNodes = resolvePasteSources(ids, findNode);
    if (!sourceNodes) return false;

    if (mode === 'cut' && hasBlockedTarget(ids)) return false;

    const target = getPasteTarget(targetId, findNode);
    if (!target) return false;

    const normalizedTargetId = target.containerId;
    if (mode === 'cut' && ids.some(id => normalizedTargetId === id || isDescendant(normalizedTargetId, id))) {
      return false;
    }

    const workingFs = mode === 'cut'
      ? removeNodes(fsRef.current, new Set(ids))
      : fsRef.current;
    const workingFindNode = (id: string) => findNodeById(id, workingFs);
    const workingTarget = getPasteTarget(targetId, workingFindNode);
    if (!workingTarget) return false;

    const pastedChildren = [...(workingTarget.container.children ?? [])];
    const updates: PathUpdate[] = [];

    for (const sourceNode of sourceNodes) {
      const finalName = resolveUniqueName(pastedChildren, sourceNode.name);
      const newRootId = joinPath(workingTarget.containerId, finalName);
      const cloned = rewriteIds(sourceNode, sourceNode.id, newRootId);
      pastedChildren.push({ ...cloned, name: finalName, id: newRootId });
      updates.push({ oldPrefix: sourceNode.id, newPrefix: newRootId });
    }

    const nextTarget = { ...workingTarget.container, children: pastedChildren };
    let nextFs = replaceNode(workingFs, workingTarget.containerId, nextTarget);

    if (mode === 'cut') {
      fsRef.current = nextFs;
      setFs(nextFs);

      const orderedUpdates = [...updates].sort((a, b) => b.oldPrefix.length - a.oldPrefix.length);
      const nextCurrentPath = rewritePath(currentPathRef.current, orderedUpdates);
      currentPathRef.current = nextCurrentPath;
      setCurrentPath(nextCurrentPath);
      const nextHistory = { ...historyRef.current, paths: rewritePaths(historyRef.current.paths, orderedUpdates) };
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setSelectedIds(prev => rewritePaths(prev, orderedUpdates));
      clipboardIdsRef.current = [];
      clipboardModeRef.current = null;
      setClipboardIds([]);
      setClipboardMode(null);
      return true;
    }

    fsRef.current = nextFs;
    setFs(nextFs);
    return true;
  }, [findNode]);

  const getDisplayPath = useCallback((): string => {
    const node = findNode(currentPath);
    if (!node) return currentPath;
    if (node.id === 'my-computer') return 'マイコンピュータ';
    return node.id;
  }, [currentPath, findNode]);

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
    copyToClipboard,
    cutToClipboard,
    paste,
    hasClipboard: clipboardIds.length > 0,
    clipboardMode,
    canGoBack: history.currentIndex > 0,
    canGoForward: history.currentIndex < history.paths.length - 1,
    canGoUp: currentPath !== 'my-computer',
    getDisplayPath,
    findNode,
    createFolder,
    deleteNodes,
    renameNode,
  };
}
