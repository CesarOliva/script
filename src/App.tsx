import { useMemo, useState } from 'react';
import { compileSource } from './Analyzer/compiler';
import { EXAMPLES, EXAMPLE_LABELS } from './Analyzer/examples';
import AstExplorer from './components/AstExplorer';

type Tab = 'tokens' | 'ast' | 'semantic' | 'symbols';

export default function App() {
  const [source, setSource] = useState<string>(EXAMPLES.valido);
  const [tab, setTab] = useState<Tab>('tokens');

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
        <section className="editor-panel">
          <h2>Código fuente</h2>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            placeholder={'program Main {\n  print("Hola");\n}'}
          />
        </section>

        <section className="result-panel">
          <nav className="tabs">
            {(
              [
                ['tokens', `Tokens (${result.tokens.length})`],
                ['ast', 'AST'],
                ['semantic', `Semántica (${result.semanticErrors.length})`],
                ['symbols', `Símbolos (${result.symbols.length})`],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? 'tab active' : 'tab'}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="tab-body">
            {tab === 'tokens' && (
              <>
                {result.lexicalErrors.length > 0 && (
                  <div className="alert error">
                    {result.lexicalErrors.map((t, i) => (
                      <div key={i}>
                        L{t.line}:{t.column} — {String(t.literal)} ('{t.lexeme}')
                      </div>
                    ))}
                  </div>
                )}
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tipo</th>
                      <th>Lexema</th>
                      <th>L:C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tokens.map((t, i) => (
                      <tr key={i} className={String(t.type) === 'ERROR' ? 'row-error' : ''}>
                        <td>{i}</td>
                        <td className="mono">{String(t.type)}</td>
                        <td className="mono">{t.lexeme || '∅'}</td>
                        <td className="mono">
                          {t.line}:{t.column}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.tokens.length === 0 && <p className="empty">Escribí código para ver los tokens.</p>}
              </>
            )}

            {tab === 'ast' && (
              <>
                {result.syntaxError && <div className="alert error">{result.syntaxError}</div>}
                {result.ast ? (
                  <AstExplorer ast={result.ast} />
                ) : (
                  !result.syntaxError && <p className="empty">Sin AST (hay errores léxicos o no hay código).</p>
                )}
              </>
            )}

            {tab === 'semantic' && (
              <>
                {result.syntaxError && (
                  <div className="alert error">No se ejecutó el análisis semántico: hay un error sintáctico.</div>
                )}
                {!result.syntaxError && result.semanticErrors.length === 0 && result.ast && (
                  <div className="alert ok">Análisis semántico exitoso: sin errores.</div>
                )}
                {result.semanticErrors.map((e, i) => (
                  <div key={i} className="alert error">
                    {i + 1}. {e.message}
                    {e.line !== undefined ? ` (L${e.line}${e.column !== undefined ? `:${e.column}` : ''})` : ''}
                  </div>
                ))}
                {!result.ast && !result.syntaxError && (
                  <p className="empty">Escribí código para correr el análisis semántico.</p>
                )}
              </>
            )}

            {tab === 'symbols' && (
              <>
                {result.symbols.length === 0 ? (
                  <p className="empty">Sin símbolos globales (¿errores de sintaxis o programa vacío?).</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Kind</th>
                        <th>Scope</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.symbols.map((s, i) => (
                        <tr key={i}>
                          <td className="mono">{s.name}</td>
                          <td className="mono">{s.type}</td>
                          <td className="mono">{s.kind}</td>
                          <td className="mono">{s.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
