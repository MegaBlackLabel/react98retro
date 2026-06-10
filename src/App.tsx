import { useState } from 'react';
import { FileExplorer } from './features/file-explorer/FileExplorer';
import { Win98Provider } from './components/Win98Provider';

interface ExplorerConfig {
  id: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
}

const EXPLORERS: ExplorerConfig[] = [
  {
    id: 'explorer-1',
    initialX: 20,
    initialY: 20,
    initialWidth: 780,
    initialHeight: 500,
  },
  {
    id: 'explorer-2',
    initialX: 300,
    initialY: 100,
    initialWidth: 700,
    initialHeight: 450,
  },
];

function App() {
  const [openExplorers, setOpenExplorers] = useState<Set<string>>(
    () => new Set(EXPLORERS.map((e) => e.id))
  );

  const handleClose = (id: string) => {
    setOpenExplorers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <Win98Provider style={{ width: '100vw', height: '100vh', background: '#008080', position: 'relative', overflow: 'hidden' }}>
      {EXPLORERS.map((explorer) =>
        openExplorers.has(explorer.id) ? (
          <FileExplorer
            key={explorer.id}
            initialX={explorer.initialX}
            initialY={explorer.initialY}
            initialWidth={Math.min(
              explorer.initialWidth,
              typeof window !== 'undefined' ? window.innerWidth - 40 : explorer.initialWidth
            )}
            initialHeight={Math.min(
              explorer.initialHeight,
              typeof window !== 'undefined' ? window.innerHeight - 40 : explorer.initialHeight
            )}
            onClose={() => handleClose(explorer.id)}
          />
        ) : null
      )}
    </Win98Provider>
  );
}

export default App
