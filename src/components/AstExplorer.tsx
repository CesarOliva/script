import { useState } from 'react';
import type { ProgramNode } from '../Analyzer/ast';
import AstGraph from './AstGraph';
import AstTree from './AstTree';

type Mode = 'graph' | 'list' | 'json';

export default function AstExplorer({ ast }: { ast: ProgramNode }) {
  const [mode, setMode] = useState<Mode>('graph');

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2.5">
        {(
          [
            ['graph', 'Grafo D3'],
            ['list', 'Lista colapsable'],
            ['json', 'JSON'],
          ] as [Mode, string][]
        ).map(([m, label]) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              className={
                isActive
                  ? 'rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-colors bg-blue-600 border-blue-600 text-white'
                  : 'rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-colors bg-transparent border-[#2c3a52] text-[#aeb9ca] hover:bg-[#223052] hover:text-white'
              }
              onClick={() => setMode(m)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {mode === 'graph' && <AstGraph ast={ast} />}
      {mode === 'list' && <AstTree ast={ast} />}
      {mode === 'json' && (
        <pre className="bg-[#0b0f16] border border-[#2b3850] rounded-lg p-3 text-xs overflow-auto">
          {JSON.stringify(ast, null, 2)}
        </pre>
      )}
    </div>
  );
}
