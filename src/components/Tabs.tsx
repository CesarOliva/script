import type { CompileResult } from '../Analyzer/compiler';
import AstExplorer from './AstExplorer';

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

function tabButtonClass(isActive: boolean): string {
    const base = 'rounded-md border px-4 py-2 text-sm cursor-pointer transition-colors font-[500]';

    return isActive
        ? `${base} bg-blue-600 border-blue-600 text-white`
        : `${base} bg-transparent border-[#2c3a52] text-[#aeb9ca] hover:bg-[#223052] hover:text-white`;
}

const alertBase = 'rounded-lg px-3 py-2.5 mb-2 text-[13px] border';
const alertError = `${alertBase} bg-[rgba(255,90,90,0.1)] border-[#8f2b33] text-[#ffb4b4]`;
const alertOk = `${alertBase} bg-[rgba(60,220,130,0.1)] border-[#1f7a4d] text-[#7df0ab]`;
const emptyText = 'text-[#8b96a8] text-sm';

const thClass = 'text-left px-2 py-1.5 border-b border-[#223047] text-[#8b96a8] font-semibold';
const tdClass = 'text-left px-2 py-1.5 border-b border-[#223047] font-[600]';

const tokenTypeColors: Record<string, string> = {
    'program': 'bg-purple-400/20 text-purple-300',

    'int': 'bg-blue-400/20 text-blue-300',
    'float': 'bg-blue-400/20 text-blue-300',
    'bool': 'bg-blue-400/20 text-blue-300',
    'string': 'bg-blue-400/20 text-blue-300',
    'stack': 'bg-blue-400/20 text-blue-300',
    'queue': 'bg-blue-400/20 text-blue-300',

    'if': 'bg-green-400/20 text-green-300',
    'else': 'bg-green-400/20 text-green-300',
    'for': 'bg-green-400/20 text-green-300',
    'while': 'bg-green-400/20 text-green-300',

    'const': 'bg-teal-400/20 text-teal-300',
    'print': 'bg-teal-400/20 text-teal-300',
    'read': 'bg-teal-400/20 text-teal-300',

    'identifier': 'bg-yellow-400/20 text-yellow-300',
    'integerLiteral': 'bg-yellow-400/20 text-yellow-300',
    'floatLiteral': 'bg-yellow-400/20 text-yellow-300',
    'booleanLiteral': 'bg-yellow-400/20 text-yellow-300',
    'stringLiteral': 'bg-yellow-400/20 text-yellow-300',

    'assign': 'bg-olive-400/20 text-olive-300',
    'plus': 'bg-olive-400/20 text-olive-300',
    'minus': 'bg-olive-400/20 text-olive-300',
    'multiply': 'bg-olive-400/20 text-olive-300',
    'module': 'bg-olive-400/20 text-olive-300',
    'divide': 'bg-olive-400/20 text-olive-300',
    'equal_equal': 'bg-olive-400/20 text-olive-300',
    'not_equal': 'bg-olive-400/20 text-olive-300',
    'less_than': 'bg-olive-400/20 text-olive-300',
    'less_than_equal': 'bg-olive-400/20 text-olive-300',
    'greater_than': 'bg-olive-400/20 text-olive-300',
    'greater_than_equal': 'bg-olive-400/20 text-olive-300',
    'and': 'bg-olive-400/20 text-olive-300',
    'or': 'bg-olive-400/20 text-olive-300',
    'not': 'bg-olive-400/20 text-olive-300',

    'leftBrace': 'bg-fuchsia-400/20 text-fuchsia-300',
    'rightBrace': 'bg-fuchsia-400/20 text-fuchsia-300',
    'leftParen': 'bg-fuchsia-400/20 text-fuchsia-300',
    'rightParen': 'bg-fuchsia-400/20 text-fuchsia-300',
    'leftBracket': 'bg-fuchsia-400/20 text-fuchsia-300',
    'rightBracket': 'bg-fuchsia-400/20 text-fuchsia-300',
    'semicolon': 'bg-fuchsia-400/20 text-fuchsia-300',
    'comma': 'bg-fuchsia-400/20 text-fuchsia-300',
    'dot': 'bg-fuchsia-400/20 text-fuchsia-300',

    'EOF': 'bg-neutral-400/20 text-neutral-300',
    'ERROR': 'bg-red-400/20 text-red-300',
};

export default function Tabs({ activeTab, onTabChange, result }: TabsProps) {
    const hasLexicalError = result.lexicalErrors.length > 0;
    const hasSyntaxError = result.syntaxError !== null && result.syntaxError !== undefined && result.syntaxError !== '';
    const hasSemanticErrors = result.semanticErrors.length > 0;

    return (
        <div>
            <nav className="flex gap-2 mb-3 flex-wrap">
                {TABS.map(({ id, getLabel }) => (
                    <button
                        key={id}
                        className={tabButtonClass(activeTab === id)}
                        onClick={() => onTabChange(id)}
                    >
                        {getLabel(result)}
                    </button>
                ))}
            </nav>

            <div className="overflow-auto max-h-[520px]">
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
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
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
                    </>
                )}

                {activeTab === 'ast' && (
                    <>
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
                                <p className={emptyText}>Sin AST: escribí código para generarlo.</p>
                            )
                        )}
                    </>
                )}

                {activeTab === 'semantic' && (
                    <>
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
                            <p className={emptyText}>
                                Escribe código para correr el análisis semántico.
                            </p>
                        )}
                    </>
                )}

                {activeTab === 'symbols' && (
                <>
                    {(hasLexicalError || hasSyntaxError || hasSemanticErrors) ? (
                        <div className={alertError}>
                            No se pueden mostrar los símbolos: hay errores en fases previas.
                        </div>
                    ) : result.symbols.length === 0 ? (
                        <p className={emptyText}>
                            Sin símbolos: escribe código para generarlos.
                        </p>
                    ) : (
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
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
                                <td className={`${tdClass} font-mono`}>{s.type}</td>
                                <td className={`${tdClass} font-mono`}>{s.kind}</td>
                                <td className={`${tdClass} font-mono`}>{s.scope}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </>
                )}
            </div>
        </div>
    );
}
