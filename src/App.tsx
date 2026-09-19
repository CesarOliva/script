import { useMemo, useState } from 'react';
import { compileSource } from './Analyzer/compiler';
import { EXAMPLES, EXAMPLE_LABELS } from './Analyzer/examples';
import CodeEditor from './components/CodeEditor';
import Tabs, { type TabId } from './components/Tabs';

export default function App() {
  const [source, setSource] = useState<string>(EXAMPLES.valido);
  const [tab, setTab] = useState<TabId>('tokens');

  const result = useMemo(() => compileSource(source), [source]);

  const status = !source.trim()
    ? { label: 'Sin código', className: 'badge neutral' }
    : result.lexicalErrors.length > 0
      ? { label: `❌ ${result.lexicalErrors.length} error(es) léxico(s)`, className: 'badge error' }
      : result.syntaxError
        ? { label: '❌ Error sintáctico', className: 'badge error' }
        : result.semanticErrors.length > 0
          ? { label: `❌ ${result.semanticErrors.length} error(es) semántico(s)`, className: 'badge error' }
          : result.ok
            ? { label: '✅ Compilación correcta', className: 'badge ok' }
            : { label: 'Sin resultado', className: 'badge neutral' };

  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>PyScript — Playground</h1>
          <p>Léxico → Sintaxis → Semántica, en vivo desde React</p>
        </div>
        <span className={status.className}>{status.label}</span>
      </header>

      <div className="examples">
        {Object.keys(EXAMPLES).map((key) => (
          <button
            key={key}
            className={source === EXAMPLES[key] ? 'chip active' : 'chip'}
            onClick={() => setSource(EXAMPLES[key])}
          >
            {EXAMPLE_LABELS[key]}
          </button>
        ))}
      </div>

      <main className="panels">
        <section className="min-h-[540px]">
          <CodeEditor
            value={source}
            onChange={setSource}
            placeholder={'program Main {\n  print("Hola");\n}'}
            fileName={
              source === EXAMPLES.valido ? 'valido.pys' : 
              source === EXAMPLES.errores ? 'errores.pys' : 
              source === EXAMPLES.scope ? 'scope.pys' : 
              source === EXAMPLES.arrays ? 'arrays.pys' : 
              source === EXAMPLES.stack ? 'stack.pys' : 
              'main.pys'}
          />
        </section>

        <section className="result-panel">
          <Tabs activeTab={tab} onTabChange={setTab} result={result} />
        </section>
      </main>
    </div>
  );
}
