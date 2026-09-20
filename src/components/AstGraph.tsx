import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ProgramNode } from '../Analyzer/ast';
import { toUiTree, type UiNode } from './AstTree';
import { astMetaClass, miniBtnClass, searchInputClass } from './styles';

interface GNode {
  ui: UiNode;
  edge: string;
}

const KIND_FILL: Record<UiNode['kind'], string> = {
  root: '#1e2b4d',
  statement: '#123f2a',
  expression: '#3a2a10',
  leaf: '#2a2233',
};

const KIND_STROKE: Record<UiNode['kind'], string> = {
  root: '#3b5bdb',
  statement: '#1f7a4d',
  expression: '#9a6b1f',
  leaf: '#6d5b8f',
};

const NODE_W = 190;
const NODE_H = 50;
const DX = 240; // separación horizontal
const DY = 78; // separación vertical

function collectAll(n: UiNode, out: string[] = []): string[] {
  out.push(n.key);
  n.children.forEach((c) => collectAll(c.node, out));
  return out;
}

function countAll(n: UiNode): number {
  return 1 + n.children.reduce((a, c) => a + countAll(c.node), 0);
}

function hiddenCount(n: UiNode, collapsed: Set<string>): number {
  if (collapsed.has(n.key)) return countAll(n) - 1;
  return n.children.reduce((a, c) => a + hiddenCount(c.node, collapsed), 0);
}

function matches(ui: UiNode, q: string): boolean {
  return `${ui.title} ${ui.subtitle ?? ''} ${ui.kind}`.toLowerCase().includes(q);
}

function truncate(s: string | undefined, n = 24): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export default function AstGraph({ ast }: { ast: ProgramNode }) {
  const tree = useMemo(() => toUiTree(ast), [ast]);
  const total = useMemo(() => countAll(tree), [tree]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Colapso inicial: profundidad >= 2 colapsada (árbol grande legible).
  useEffect(() => {
    const keep = new Set<string>();
    const visit = (n: UiNode, d: number) => {
      if (d >= 2) keep.add(n.key);
      n.children.forEach((c) => visit(c.node, d + 1));
    };
    visit(tree, 0);
    // Pero la raíz y su hijo Body siempre visibles:
    keep.delete(tree.key);
    tree.children.forEach((c) => keep.delete(c.node.key));
    setCollapsed(keep);
    setQuery('');
  }, [tree]);

  useEffect(() => {
    if (query.trim()) setCollapsed(new Set());
  }, [query]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Layout D3 (recalculado al colapsar/buscar)
  const { nodes, links, width, height } = useMemo(() => {
    const rootData: GNode = { ui: tree, edge: 'root' };
    const root = d3.hierarchy<GNode>(rootData, (d) =>
      collapsed.has(d.ui.key) ? [] : d.ui.children.map((c) => ({ ui: c.node, edge: c.edge })),
    );
    const layout = d3.tree<GNode>().nodeSize([DY, DX]);
    layout(root);
    const desc = root.descendants();
    const lnks = root.links();
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = 0;
    desc.forEach((d) => {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    if (!isFinite(minX)) {
      minX = 0;
      maxX = 0;
    }
    const w = maxY + NODE_W + 120;
    const h = Math.max(320, maxX - minX + 140);
    const xOff = -minX + 70;
    desc.forEach((d) => {
      d.x = (d.x ?? 0) + xOff;
    });
    return { nodes: desc, links: lnks, width: w, height: h };
  }, [tree, collapsed]);

  // Zoom / pan con D3
  useEffect(() => {
    const el = svgRef.current;
    const g = gRef.current;
    if (!el || !g) return;
    const svg = d3.select(el);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .on('zoom', (e) => {
        d3.select(g).attr('transform', e.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  const resetZoom = () => {
    const el = svgRef.current;
    if (!el || !zoomRef.current) return;
    const t = d3.select(el).transition().duration(300);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const q = query.trim().toLowerCase();
  const linkGen = useMemo(
    () =>
      d3
        .linkHorizontal()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .x((d: any) => d.y)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .y((d: any) => d.x),
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <input
          className={searchInputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Resaltar nodos… (ej. BinaryExpression, cond, push)"
        />
        <div className="flex gap-2 flex-wrap">
          <button className={miniBtnClass} onClick={() => setCollapsed(new Set())}>
            Expandir todo
          </button>
          <button
            className={miniBtnClass}
            onClick={() => setCollapsed(new Set(collectAll(tree)))}
          >
            Colapsar todo
          </button>
          <button className={miniBtnClass} onClick={resetZoom}>
            Centrar
          </button>
        </div>
      </div>
      <div className={astMetaClass}>
        {total} nodo(s) · {nodes.length} visibles · {total - nodes.length} ocultos · arrastra
        para pan · rueda para zoom · clic en nodo para colapsar/expandir
      </div>

      <div className="flex gap-3 flex-wrap text-xs text-[#9aa4b2]">
        {(
          [
            ['root', 'Program'],
            ['statement', 'Sentencia'],
            ['expression', 'Expresión'],
            ['leaf', 'Hoja'],
          ] as const
        ).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border inline-block"
              style={{ background: KIND_FILL[k], borderColor: KIND_STROKE[k] }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="bg-[#0b0f16] border border-[#2b3850] rounded-lg overflow-auto">
        <svg
          ref={svgRef}
          width="100%"
          height={Math.min(560, height)}
          className="block min-h-[320px] cursor-grab active:cursor-grabbing"
        >
          <g ref={gRef}>
            {links.map((l, i) => {
              const s = l.source as d3.HierarchyPointNode<GNode>;
              const t = l.target as d3.HierarchyPointNode<GNode>;
              const sx = s.x ?? 0;
              const sy = s.y ?? 0;
              const tx = t.x ?? 0;
              const ty = t.y ?? 0;
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;
              return (
                <g key={i}>
                  <path
                    d={linkGen(l as never) ?? ''}
                    fill="none"
                    stroke="#3b4a63"
                    strokeWidth={1.5}
                  />
                  <text
                    x={my}
                    y={mx - 6}
                    textAnchor="middle"
                    fill="#7d8aa0"
                    fontSize={10}
                    fontFamily="Consolas, monospace"
                    stroke="#0b0f16"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {(t.data as GNode).edge}
                  </text>
                </g>
              );
            })}
            {nodes.map((d, i) => {
              const g = d.data as GNode;
              const isCollapsed = collapsed.has(g.ui.key);
              const hasKids = g.ui.children.length > 0;
              const hidden = hasKids ? hiddenCount(g.ui, collapsed) : 0;
              const hit = q ? matches(g.ui, q) : false;
              return (
                <g
                  key={`${g.ui.key}-${i}`}
                  transform={`translate(${d.y ?? 0},${d.x ?? 0})`}
                  onClick={() => hasKids && toggle(g.ui.key)}
                  className={hasKids ? 'cursor-pointer' : undefined}
                  style={
                    hit
                      ? { filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' }
                      : undefined
                  }
                >
                  <rect
                    x={-NODE_W / 2}
                    y={-NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={KIND_FILL[g.ui.kind]}
                    stroke={hit ? '#ffffff' : KIND_STROKE[g.ui.kind]}
                    strokeWidth={hit ? 2.5 : 1.5}
                    strokeDasharray={isCollapsed ? '6 4' : undefined}
                  />
                  <text
                    textAnchor="middle"
                    y={-6}
                    fill="#fff"
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="Consolas, monospace"
                  >
                    {truncate(g.ui.title, 26)}
                  </text>
                  {(g.ui.subtitle || hasKids) && (
                    <text
                      textAnchor="middle"
                      y={11}
                      fill="#c3cede"
                      fontSize={10}
                      fontFamily="Consolas, monospace"
                    >
                      {truncate(
                        g.ui.subtitle ?? `${g.ui.children.length} hijo(s)`,
                        26,
                      )}
                    </text>
                  )}
                  {hasKids && (
                    <g transform={`translate(${NODE_W / 2 - 2},${-NODE_H / 2 + 2})`}>
                      <circle r={11} fill="#2563eb" stroke="#dbeafe" strokeWidth={1} />
                      <text
                        textAnchor="middle"
                        dy={4}
                        fill="#fff"
                        fontSize={11}
                        fontWeight={800}
                      >
                        {isCollapsed ? `+${g.ui.children.length}` : '–'}
                      </text>
                    </g>
                  )}
                  {hidden > 0 && isCollapsed && (
                    <text
                      textAnchor="middle"
                      y={NODE_H / 2 + 14}
                      fill="#7d8aa0"
                      fontSize={10}
                    >
                      {hidden} oculto(s)
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <span style={{ display: 'none' }}>{width}x{height}</span>
    </div>
  );
}
