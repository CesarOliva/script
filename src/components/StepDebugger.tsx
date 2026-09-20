import { useState } from 'react';
import type { StepSnapshot } from '../Analyzer/compilerStepEngine';
import AstExplorer from './AstExplorer';
import { alertError, alertInfo, buttonClass, tdClass, thClass, tokenTypeColors } from './styles';

interface StepDebuggerProps {
  steps: StepSnapshot[];
  index: number;
}

export type StepView = 'lexer' | 'ast' | 'symbols' | 'diagnostics';

export const phaseLabel: Record<string, string> = {
  inicio: 'Inicio',
  lexer: 'Lexer',
  parser: 'Parser',
  semantico: 'Semántico',
  fin: 'Fin',
  error: 'Error',
};

function LexerPanel({ snap }: { snap: StepSnapshot }) {
  return (
    <div>
      <div className="overflow-auto">
        {snap.tokensProcessed.length === 0 ? (
          <p className="p-3 text-sm text-[#8b96a8]">Sin tokens todavía.</p>
        ) : (
          <table className="relative w-full border-collapse text-[13px]">
            <thead className="sticky top-0 left-0 w-full bg-[#233148]/30 backdrop-blur-sm z-10">
              <tr><th className={thClass}>#</th><th className={thClass}>Tipo</th><th className={thClass}>Lexema</th><th className={thClass}>Ubicación</th></tr>
            </thead>
            <tbody>
              {snap.tokensProcessed.map((t, i) => (
                <tr
                  key={i}
                  className={String(t.type) === 'ERROR' ? 'bg-[rgba(255,80,80,0.08)]' : t.line === snap.currentCodeLine ? 'bg-amber-400/10' : ''}
                >
                  <td className={tdClass}>{i}</td>
                  <td className={`${tdClass} font-mono`}>
                    <div className={`inline-flex border border-neutral-50/30 rounded-md py-1 px-2 ${tokenTypeColors[String(t.type)] || ''}`}>
                      {String(t.type)}
                    </div>
                  </td>
                  <td className={`${tdClass} font-mono`}>{t.lexeme || '∅'}</td>
                  <td className={`${tdClass} font-mono`}>{t.line}:{t.column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SymbolsPanel({ snap }: { snap: StepSnapshot }) {
  return (
    <div>
      <div className="overflow-auto">
        {snap.symbolTableState.length === 0 ? (
          <p className="p-3 text-sm text-[#8b96a8]">Sin símbolos registrados aún.</p>
        ) : (
          <table className="relative w-full border-collapse text-[13px]">
            <thead className="sticky top-0 left-0 w-full bg-[#1f2a3c]/90 backdrop-blur-sm z-10">
              <tr><th className={thClass}>Nombre</th><th className={thClass}>Tipo</th><th className={thClass}>Kind</th><th className={thClass}>Scope</th></tr>
            </thead>
            <tbody>
              {snap.symbolTableState.map((s, i) => (
                <tr key={i}>
                  <td className={`${tdClass} font-mono`}>{s.name}</td>
                  <td className={`${tdClass} font-mono`}>
                    <div className={`inline-flex border border-neutral-50/30 rounded-md py-1 px-2 ${tokenTypeColors[String(s.type)] || ''}`}>
                      {String(s.type)}
                    </div>
                  </td>
                  <td className={`${tdClass} font-mono`}>{s.kind}</td>
                  <td className={`${tdClass} font-mono`}>{s.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AstPanel({ snap }: { snap: StepSnapshot }) {
  return (
    <div className="p-3 overflow-auto">
      {snap.astPartial ? (
        <AstExplorer ast={snap.astPartial} />
      ) : (
        <div className={alertError}>Sin AST en este paso: hay errores en fases previas.</div>
      )}
    </div>
  );
}

function DiagnosticsPanel({ snap }: { snap: StepSnapshot }) {
  return (
    <div className="p-3 overflow-auto">
      {snap.errors.length === 0 ? (
        <div className="rounded-lg px-3 py-2.5 text-[13px] border bg-[rgba(60,220,130,0.1)] border-[#1f7a4d] text-[#7df0ab]">
          ✓ Sin errores hasta este paso.
        </div>
      ) : (
        snap.errors.map((e, i) => {
          const isNew = snap.newErrors.some((n) => n.kind === e.kind && n.message === e.message);
          return (
            <div key={i} className={`${alertError} ${isNew ? 'border-red-400 font-semibold' : ''}`}>
              {isNew ? '🔴 NUEVO en este paso — ' : ''}[{e.kind}] {e.message}
              {e.line !== undefined ? ` (L${e.line}${e.column !== undefined ? `:${e.column}` : ''})` : ''}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function StepDebugger({ steps, index }: StepDebuggerProps) {
  const [view, setView] = useState<StepView>('lexer');

  const snap = steps[Math.min(index, steps.length - 1)];

  if (!snap) return null;
  const hasStepErrors = snap.newErrors.length > 0 || (snap.errors.length > 0 && snap.phase === 'error');

  const VIEWS: { id: StepView; label: string }[] = [
    { id: 'lexer', label: `Lexer (${snap.tokensProcessed.length})` },
    { id: 'ast', label: 'AST' },
    { id: 'symbols', label: `Símbolos (${snap.symbolTableState.length})` },
    { id: 'diagnostics', label: `Diagnóstico (${snap.errors.length})` },
  ];

  return (
    <section className="md:col-span-5 border border-amber-400/30 rounded-xl bg-white/2 flex flex-col min-h-130 md:min-h-0 md:flex-1 md:overflow-hidden lg:h-full">
      { view === 'lexer' ? (
        <h4 className="m-0 px-4 pt-4 text-md font-semibold text-slate-200">
          a) Lexer — tokens consumidos ({snap.tokensProcessed.length})
        </h4>
      ) : view === 'symbols' ? (
        <h4 className="m-0 px-4 pt-4 text-md font-semibold text-slate-200">
          c) Tabla de Símbolos ({snap.symbolTableState.length}) · Scopes activos: [{snap.activeScopes.join(', ')}]
        </h4>
      ): view === 'ast' ? (
        <h4 className="m-0 px-4 pt-4 text-md font-semibold text-slate-200">
          b) AST parcial {snap.astPartial ? `(${(snap.astPartial.body?.length ?? 0)} sentencia(s))` : '(no disponible)'}
        </h4>
      ) : (
        <h4 className="m-0 px-4 pt-4 text-md font-semibold text-slate-200">
          d) Consola de Diagnóstico ({snap.errors.length})
        </h4>
      )}

      <div className="px-4 pt-3 shrink-0">
        <div className={hasStepErrors ? alertError : alertInfo}>
          <span className="font-semibold">Paso {snap.stepIndex}: </span>{snap.explanationText}
          <div className="font-mono text-xs opacity-80 mt-1">L{snap.currentCodeLine}: {snap.sourceLineText.trim() || '(línea vacía)'}</div>
        </div>
      </div>

      <nav className="flex gap-2 flex-wrap px-4 pt-3 shrink-0">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            className={buttonClass(view === id)}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="pt-4 overflow-auto md:flex-1 md:min-h-0">
        {view === 'lexer' && <LexerPanel snap={snap} />}
        {view === 'symbols' && <SymbolsPanel snap={snap} />}
        {view === 'ast' && <AstPanel snap={snap} />}
        {view === 'diagnostics' && <DiagnosticsPanel snap={snap} />}
      </div>
    </section>
  );
}
