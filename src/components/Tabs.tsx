import type { CompileResult } from '../Analyzer/compiler';
import AstExplorer from './AstExplorer';
import { buttonClass, alertError,  thClass, tdClass, alertOk, emptyText, alertInfo, tokenTypeColors } from './styles';

export type TabId = 'tokens' | 'ast' | 'semantic' | 'symbols';

interface TabsProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    result: CompileResult;
}

const TABS: { id: TabId; getLabel: (result: CompileResult) => string }[] = [
    { id: 'tokens', getLabel: (r) => `Tokens (${r.tokens.length})` },
    { id: 'ast', getLabel: () => 'AST' },
    { id: 'semantic', getLabel: (r) => `Semántica (${r.semanticErrors.length})` },
    { id: 'symbols', getLabel: (r) => `Símbolos (${r.symbols.length})` },
];

export default function Tabs({ activeTab, onTabChange, result }: TabsProps) {
    const hasLexicalError = result.lexicalErrors.length > 0;
    const hasSyntaxError = result.syntaxError !== null && result.syntaxError !== undefined && result.syntaxError !== '';
    const hasSemanticErrors = result.semanticErrors.length > 0;

    return (
        <section className="md:col-span-5 bg-white/2 border border-[#263145] rounded-xl flex flex-col min-h-130 md:min-h-0 md:flex-1 md:overflow-hidden lg:h-full">
            <nav className="flex gap-2 my-3 flex-wrap px-4 shrink-0">
                {TABS.map(({ id, getLabel }) => (
                    <button
                        key={id}
                        className={buttonClass(activeTab === id)}
                        onClick={() => onTabChange(id)}
                    >
                        {getLabel(result)}
                    </button>
                ))}
            </nav>

            <div className="rounded-b-lg border-t border-[#223047] overflow-auto max-h-130 md:max-h-none md:flex-1 md:min-h-0">
                {activeTab === 'tokens' && (
                    <>
                        {result.lexicalErrors.length > 0 && (
                            <div className={alertError}>
                                {result.lexicalErrors.map((t, i) => (
                                    <div key={i}>
                                        {t.line}:{t.column} — {String(t.literal)} ('{t.lexeme}')
                                    </div>
                                ))}
                            </div>
                        )}
                        {result.tokens.length === 0 ? (
                            <div className="p-4">
                                <div className={alertInfo}>
                                    <p className={emptyText}>
                                        Sin símbolos: escribe código para generarlos.
                                    </p>
                                </div>
                            </div>
                        ): (
                            <table className="relative w-full border-collapse text-[13px]">
                                <thead className="sticky top-0 left-0 w-full bg-[#233148]/30 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className={thClass}>#</th>
                                        <th className={thClass}>Tipo</th>
                                        <th className={thClass}>Lexema</th>
                                        <th className={thClass}>Ubicación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.tokens.map((t, i) => (
                                        <tr
                                            key={i}
                                            className={String(t.type) === 'ERROR' ? 'bg-[rgba(255,80,80,0.08)]' : ''}
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
                    </>
                )}

                {activeTab === 'ast' && (
                    <div className="p-4">
                        {(hasLexicalError || hasSyntaxError) && (
                            <div className={alertError}>
                                No se puede mostrar el AST: hay errores en fases previas.
                            </div>
                        )}

                        {result.ast ? (
                            <AstExplorer ast={result.ast} />
                        ) : (
                            !hasLexicalError &&
                            !hasSyntaxError && (
                                <div className={alertInfo}>
                                    <p className={emptyText}>Sin AST: escribe código para generarlo.</p>
                                </div>
                            )
                        )}
                    </div>
                )}

                {activeTab === 'semantic' && (
                    <div className="p-4">
                        {(hasLexicalError || hasSyntaxError) && (
                            <div className={alertError}>
                                No se puede mostrar el análisis semántico: hay errores en fases previas.
                            </div>
                        )}

                        {!hasLexicalError &&
                            !hasSyntaxError &&
                            !hasSemanticErrors &&
                            result.ast && (
                                <div className={alertOk}>Análisis semántico exitoso: sin errores.</div>
                            )}

                        {!hasLexicalError &&
                            !hasSyntaxError &&
                            result.semanticErrors.map((e, i) => (
                                <div key={i} className={alertError}>
                                    {i + 1}. {e.message}
                                    {e.line !== undefined
                                        ? ` (L${e.line}${e.column !== undefined ? `:${e.column}` : ''})`
                                        : ''}
                                </div>
                            ))}

                        {!result.ast && !hasSyntaxError && !hasLexicalError && (
                            <div className={alertInfo}>
                                <p className={emptyText}>
                                    Escribe código para correr el análisis semántico.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'symbols' && (
                    <div>
                        {(hasLexicalError || hasSyntaxError || hasSemanticErrors) ? (
                            <div className={alertError}>
                                No se pueden mostrar los símbolos: hay errores en fases previas.
                            </div>
                        ) : result.symbols.length === 0 ? (
                            <div className="p-4">
                                <div className={alertInfo}>
                                    <p className={emptyText}>
                                        Sin símbolos: escribe código para generarlos.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="relative w-full border-collapse text-[13px]">
                                <thead className="sticky top-0 left-0 w-full bg-[#1f2a3c]/90 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className={thClass}>Nombre</th>
                                        <th className={thClass}>Tipo</th>
                                        <th className={thClass}>Kind</th>
                                        <th className={thClass}>Scope</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.symbols.map((s, i) => (
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
                )}
            </div>
        </section>
    );
}
