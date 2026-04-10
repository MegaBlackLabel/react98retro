import { useState } from 'react';
import { FileExplorer } from './features/file-explorer/FileExplorer';
import { Win98Provider } from './components/Win98Provider';

function App() {
  const [explorerOpen, setExplorerOpen] = useState(true);

  return (
    <Win98Provider style={{ width: '100vw', height: '100vh', background: '#008080', position: 'relative', overflow: 'hidden' }}>
      {explorerOpen && (
        <FileExplorer
          initialX={20}
          initialY={20}
          initialWidth={Math.min(780, typeof window !== 'undefined' ? window.innerWidth - 40 : 780)}
          initialHeight={Math.min(500, typeof window !== 'undefined' ? window.innerHeight - 40 : 500)}
          onClose={() => setExplorerOpen(false)}
        />
      )}
    </Win98Provider>
  );
}

export default App
