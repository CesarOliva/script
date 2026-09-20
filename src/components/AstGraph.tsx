import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import type { UiNode } from './AstTree';

export type AstCategory = 'program' | 'declaration' | 'statement' | 'expression' | 'other';

interface GNode {
  ui: UiNode;
}

export const CATEGORY_META: Record<
  AstCategory,
  { label: string; dot: string; fill: string; stroke: string; accent: string; icon: string }
> = {
  program: {
    label: 'Programa',
    dot: '#3b82f6',
    fill: 'rgba(59, 99, 235, 0.28)',
    stroke: 'rgba(93, 135, 255, 0.75)',
    accent: '#7ea2ff',
    icon: '</>',
  },
  declaration: {
    label: 'Declaración',
    dot: '#8b5cf6',
    fill: 'rgba(139, 92, 246, 0.16)',
    stroke: 'rgba(139, 92, 246, 0.55)',
    accent: '#a78bfa',
    icon: '⧉',
  },
  statement: {
    label: 'Sentencia',
    dot: '#10b981',
    fill: 'rgba(16, 185, 129, 0.13)',
    stroke: 'rgba(16, 185, 129, 0.5)',
    accent: '#34d399',
    icon: '⬢',
  },
  expression: {
    label: 'Expresión',
    dot: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.13)',
    stroke: 'rgba(245, 158, 11, 0.5)',
    accent: '#fbbf24',
    icon: '⬣',
  },
  other: {
    label: 'Otro',
    dot: '#64748b',
    fill: 'rgba(148, 163, 184, 0.12)',
    stroke: 'rgba(148, 163, 184, 0.45)',
    accent: '#94a3b8',
    icon: '●',
  },
};

const DECL_TITLES = new Set(['VariableDeclaration', 'ConstantDeclaration']);

export function categoryOf(title: string): AstCategory {
  if (title === 'Program' || title.startsWith('Program:')) return 'program';
  if (DECL_TITLES.has(title)) return 'declaration';
  if (
    title === 'Block' ||
    title === 'Body' ||
    title === 'Assignment' ||
    title === 'IfStatement' ||
    title === 'ForStatement' ||
    title === 'WhileStatement' ||
    title === 'PrintStatement' ||
    title === 'ReadStatement' ||
    title === 'ExpressionStatement' ||
    title === 'MethodCall'
  )
    return 'statement';
  if (
    title === 'BinaryExpression' ||
    title === 'UnaryExpression' ||
    title === 'ArrayLiteral' ||
    title === 'IndexAccess'
  )
    return 'expression';
  return 'other';
}

const SHORT_LABELS: Record<string, string> = {
  VariableDeclaration: 'VarDecl',
  ConstantDeclaration: 'ConstDecl',
  Assignment: 'Assign',
  IfStatement: 'If',
  ForStatement: 'For',
  WhileStatement: 'While',
  PrintStatement: 'Call',
  MethodCall: 'Call',
  ExpressionStatement: 'Expr',
  ReadStatement: 'Read',
  BinaryExpression: 'Binary',
  UnaryExpression: 'Unary',
  ArrayLiteral: 'Array',
  IndexAccess: 'Index',
  Identifier: 'Ident',
};

export function displayOf(ui: UiNode): { title: string; subtitle?: string } {
  if (ui.title.startsWith('Program:')) {
    return { title: 'Program', subtitle: ui.title.slice('Program:'.length).trim() || ui.subtitle };
  }
  return { title: SHORT_LABELS[ui.title] ?? ui.title, subtitle: ui.subtitle };
}

function truncate(s: string | undefined, n = 24): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

const NODE_W = 168;
const NODE_H = 58;
const DX = 184; // separación horizontal entre hermanos
const DY = 92; // separación vertical entre niveles
const EDGE_COLOR = '#5a6f93';

interface AstGraphProps {
  tree: UiNode;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
}

export default function AstGraph({ tree, collapsed, onToggle }: AstGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Layout vertical D3 (recalculado al colapsar)
  const { nodes, links, height } = useMemo(() => {
    const root = d3.hierarchy<GNode>({ ui: tree }, (d) =>
      collapsed.has(d.ui.key) ? [] : d.ui.children.map((c) => ({ ui: c.node })),
    );
    const layout = d3.tree<GNode>().nodeSize([DX, DY]);
    layout(root);
    const desc = root.descendants();
    const lnks = root.links();
    let minX = Infinity;
    let maxX = -Infinity;
    let maxDepth = 0;
    desc.forEach((d) => {
      const x = d.x ?? 0;
      const depth = d.depth ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (depth > maxDepth) maxDepth = depth;
    });
    if (!isFinite(minX)) {
      minX = 0;
      maxX = 0;
    }
    const xOff = -minX + NODE_W / 2 + 48;
    desc.forEach((d) => {
      d.x = (d.x ?? 0) + xOff;
      d.y = (d.depth ?? 0) * DY + 70;
    });
    void maxX;
    const h = Math.max(360, maxDepth * DY + NODE_H + 140);
    return { nodes: desc, links: lnks, height: h };
  }, [tree, collapsed]);

  // Zoom / pan con D3 (doble clic = centrar)
  useEffect(() => {
    const el = svgRef.current;
    const g = gRef.current;
    if (!el || !g) return;
    const svg = d3.select(el);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.2])
      .on('zoom', (e) => {
        d3.select(g).attr('transform', e.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('dblclick.zoom', null);
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

  const goFullscreen = () => {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void box.requestFullscreen?.();
    }
  };

  return (
    <div
      ref={boxRef}
      className="relative rounded-xl border border-[#263145] overflow-auto bg-[#0a0f1c]"
      style={{
        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      <button
        onClick={goFullscreen}
        title="Pantalla completa"
        className="absolute top-2 right-2 z-10 rounded-md border border-[#2c3a52] bg-[#111a2c]/90 px-2 py-1 text-xs text-slate-300 hover:bg-[#1a2540] cursor-pointer"
      >
        ⛶
      </button>
      <svg
        ref={svgRef}
        width="100%"
        height={Math.min(600, height)}
        onDoubleClick={resetZoom}
        className="block min-h-90 cursor-grab active:cursor-grabbing"
      >
        <defs>
          <marker
            id="ast-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR} />
          </marker>
        </defs>
        <g ref={gRef}>
          {links.map((l, i) => {
            const s = l.source as d3.HierarchyPointNode<GNode>;
            const t = l.target as d3.HierarchyPointNode<GNode>;
            const sx = s.x ?? 0;
            const sy = (s.y ?? 0) + NODE_H / 2;
            const tx = t.x ?? 0;
            const ty = (t.y ?? 0) - NODE_H / 2;
            const midY = (sy + ty) / 2;
            return (
              <path
                key={i}
                d={`M ${sx},${sy} V ${midY} H ${tx} V ${ty}`}
                fill="none"
                stroke={EDGE_COLOR}
                strokeWidth={1.5}
                markerEnd="url(#ast-arrow)"
              />
            );
          })}
          {nodes.map((d, i) => {
            const g = d.data as GNode;
            const meta = CATEGORY_META[categoryOf(g.ui.title)];
            const { title, subtitle } = displayOf(g.ui);
            const isCollapsed = collapsed.has(g.ui.key);
            const hasKids = g.ui.children.length > 0;
            return (
              <g
                key={`${g.ui.key}-${i}`}
                transform={`translate(${d.x ?? 0},${d.y ?? 0})`}
                onClick={() => hasKids && onToggle(g.ui.key)}
                className={hasKids ? 'cursor-pointer' : undefined}
              >
                <rect
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={meta.fill}
                  stroke={meta.stroke}
                  strokeWidth={1.5}
                  strokeDasharray={isCollapsed ? '5 4' : undefined}
                />
                <foreignObject
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                >
                  <div
                    style={{
                      width: NODE_W,
                      height: NODE_H,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '0 10px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    <span
                      style={{
                        color: meta.accent,
                        fontSize: 15,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {truncate(title, 18)}
                      </span>
                      {subtitle && (
                        <span
                          style={{
                            display: 'block',
                            color: '#c3cede',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {truncate(subtitle, 24)}
                        </span>
                      )}
                    </span>
                    {hasKids && (
                      <span
                        style={{
                          color: '#8b96a8',
                          fontSize: 12,
                          flexShrink: 0,
                          transform: isCollapsed ? 'rotate(-90deg)' : undefined,
                          transition: 'transform 0.15s',
                        }}
                      >
                        ⌄
                      </span>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
