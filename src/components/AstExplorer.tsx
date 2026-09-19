import { useState } from 'react';
import type { ProgramNode } from '../Analyzer/ast';
import AstGraph from './AstGraph';
import AstTree from './AstTree';

type Mode = 'graph' | 'list' | 'json';

export default function AstExplorer({ ast }: { ast: ProgramNode }) {
  const [mode, setMode] = useState<Mode>('graph');

  return (
    <div>
      <div className="ast-actions" style={{ marginBottom: 10 }}>
        {(
          [
            ['graph', 'Grafo D3'],
            ['list', 'Lista colapsable'],
            ['json', 'JSON'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            className={mode === m ? 'tab active' : 'tab'}
            onClick={() => setMode(m)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'graph' && <AstGraph ast={ast} />}
      {mode === 'list' && <AstTree ast={ast} />}
      {mode === 'json' && <pre>{JSON.stringify(ast, null, 2)}</pre>}
    </div>
  );
}
