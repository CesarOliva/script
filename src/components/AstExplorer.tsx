import { useEffect, useMemo, useState } from 'react';
import type { ProgramNode } from '../Analyzer/ast';
import AstGraph, { CATEGORY_META, type AstCategory } from './AstGraph';
import { collectKeys, toUiTree, type UiNode } from './AstTree';

const LEGEND_ORDER: AstCategory[] = ['program', 'statement', 'expression', 'declaration', 'other'];
const headerBtn = 'flex items-center gap-1.5 rounded-lg border border-[#2c3a52] bg-[#111a2c] px-3 py-1.5 text-xs text-slate-200 cursor-pointer hover:bg-[#1a2540] transition-colors';

export default function AstExplorer({ ast }: { ast: ProgramNode }) {
    const program = useMemo(() => toUiTree(ast), [ast]);

    const tree: UiNode = useMemo(() => {
        if (
            program.children.length === 1 &&
            program.children[0].node.title === 'Body'
        ) {
           return { ...program, children: program.children[0].node.children };
        }
        return program;
    }, [program]);

    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        const keep = new Set<string>();
        const visit = (n: UiNode, d: number) => {
            if (d >= 3) keep.add(n.key);
            n.children.forEach((c) => visit(c.node, d + 1));
        };
        visit(tree, 0);
        keep.delete(tree.key);
        tree.children.forEach((c) => keep.delete(c.node.key));

        setCollapsed(keep);
        setShowJson(false);
    }, [tree]);

    const toggle = (key: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            
            return next;
        });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="flex gap-2.5 items-center">
                    <span className="text-[#7c5cff] text-xl leading-none mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-network preview-icon">
                        <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
                        </svg>
                    </span>

                    <div>
                        <h3 className="m-0 text-white font-semibold text-[15px]">Árbol de Sintaxis Abstracta</h3>
                        <p className="m-0 text-xs text-slate-400">Representación estructurada del programa.</p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button className={headerBtn} onClick={() => setCollapsed(new Set())}>
                        <span>↓</span> Expandir todo
                    </button>

                    <button
                        className={headerBtn}
                        onClick={() => setCollapsed(new Set(collectKeys(tree)))}
                    >
                        <span>↑</span> Colapsar todo
                    </button>
                    
                    <button
                        className={`${headerBtn} ${showJson ? 'border-blue-500 text-white bg-blue-600' : ''}`}
                        onClick={() => setShowJson((v) => !v)}
                    >
                        <span className="font-mono">&lt;&gt;</span> JSON
                    </button>
                </div>
            </div>

            <div className="flex gap-4 flex-wrap text-xs text-slate-300">
                {LEGEND_ORDER.map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ background: CATEGORY_META[k].dot }}
                        />
                        {CATEGORY_META[k].label}
                    </span>
                ))}
            </div>

            {showJson ? (
                <pre className="bg-[#0a0f1c] border border-[#263145] rounded-xl p-3 text-xs overflow-auto text-slate-200 max-h-[560px]">
                    {JSON.stringify(ast, null, 2)}
                </pre>
            ) : (
                <AstGraph tree={tree} collapsed={collapsed} onToggle={toggle} />
            )}
        </div>
    );
}
