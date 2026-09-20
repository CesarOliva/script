import { useEffect, useMemo, useState } from 'react';
import {
  astCountClass,
  astMetaClass,
  astPillClass,
  miniBtnClass,
  panelBoxClass,
  searchInputClass,
} from './styles';
import type {
  ASTNode,
  ExpressionNode,
  ProgramNode,
  StatementNode,
} from '../Analyzer/ast';

export interface UiNode {
  key: string;
  title: string;
  subtitle?: string;
  kind: 'root' | 'statement' | 'expression' | 'leaf';
  children: { edge: string; node: UiNode }[];
}

let uid = 0;
function mk(
  title: string,
  kind: UiNode['kind'],
  subtitle?: string,
  children: { edge: string; node: UiNode }[] = [],
): UiNode {
  return { key: `n${uid++}`, title, subtitle, kind, children };
}

const STMT_TYPES = new Set([
  'VariableDeclaration',
  'ConstantDeclaration',
  'IfStatement',
  'ForStatement',
  'WhileStatement',
  'PrintStatement',
  'ReadStatement',
  'Assignment',
  'ExpressionStatement',
]);

function isStmt(n: ExpressionNode | StatementNode): n is StatementNode {
  return STMT_TYPES.has((n as { type: string }).type);
}

function exprNode(e: ExpressionNode): UiNode {
  switch (e.type) {
    case 'Literal':
      return mk('Literal', 'leaf', `${String(e.value)}  (${e.raw})`);
    case 'Identifier':
      return mk('Identifier', 'leaf', e.name);
    case 'BinaryExpression':
      return mk('BinaryExpression', 'expression', `operador: ${e.operator}`, [
        { edge: 'left', node: exprNode(e.left) },
        { edge: 'right', node: exprNode(e.right) },
      ]);
    case 'UnaryExpression':
      return mk('UnaryExpression', 'expression', `operador: ${e.operator}`, [
        { edge: 'argument', node: exprNode(e.argument) },
      ]);
    case 'MethodCall':
      return mk('MethodCall', 'expression', `${e.object}.${e.method}()`, [
        ...e.args.map((a, i) => ({ edge: `arg[${i}]`, node: exprNode(a) })),
      ]);
    case 'ArrayLiteral':
      return mk(
        'ArrayLiteral',
        'expression',
        `${e.elements.length} elemento(s)`,
        e.elements.map((el, i) => ({ edge: `[${i}]`, node: exprNode(el) })),
      );
    case 'IndexAccess':
      return mk('IndexAccess', 'expression', undefined, [
        { edge: 'array', node: exprNode(e.array) },
        { edge: 'index', node: exprNode(e.index) },
      ]);
  }
}

function stmtNode(s: StatementNode): UiNode {
  switch (s.type) {
    case 'VariableDeclaration':
      return mk('VariableDeclaration', 'statement', `${s.varType} ${s.name}`, [
        ...(s.initializer ? [{ edge: 'init', node: exprNode(s.initializer) }] : []),
      ]);
    case 'ConstantDeclaration':
      return mk('ConstantDeclaration', 'statement', `${s.varType} ${s.name}`, [
        { edge: 'value', node: exprNode(s.value) },
      ]);
    case 'Assignment':
      return mk(
        'Assignment',
        'statement',
        s.index ? `${s.target}[…] = …` : `${s.target} = …`,
        [
          ...(s.index ? [{ edge: 'index', node: exprNode(s.index) }] : []),
          { edge: 'value', node: exprNode(s.value) },
        ],
      );
    case 'PrintStatement':
      return mk('PrintStatement', 'statement', undefined, [
        { edge: 'expr', node: exprNode(s.expression) },
      ]);
    case 'ReadStatement':
      return mk('ReadStatement', 'leaf', `read(${s.target})`);
    case 'ExpressionStatement':
      return mk('ExpressionStatement', 'statement', undefined, [
        { edge: 'expr', node: exprNode(s.expression) },
      ]);
    case 'IfStatement': {
      const kids: { edge: string; node: UiNode }[] = [
        { edge: 'cond', node: exprNode(s.condition) },
        {
          edge: 'then',
          node: mk(
            'Block',
            'statement',
            `${s.thenBranch.length} sent.`,
            s.thenBranch.map((st, i) => ({ edge: `[${i}]`, node: stmtNode(st) })),
          ),
        },
      ];
      if (s.elseBranch) {
        if (Array.isArray(s.elseBranch)) {
          kids.push({
            edge: 'else',
            node: mk(
              'Block',
              'statement',
              `${s.elseBranch.length} sent.`,
              s.elseBranch.map((st, i) => ({ edge: `[${i}]`, node: stmtNode(st) })),
            ),
          });
        } else {
          kids.push({ edge: 'else if', node: stmtNode(s.elseBranch) });
        }
      }
      return mk('IfStatement', 'statement', undefined, kids);
    }
    case 'ForStatement':
      return mk('ForStatement', 'statement', undefined, [
        ...(s.init ? [{ edge: 'init', node: stmtNode(s.init) }] : []),
        ...(s.condition
          ? [{ edge: 'cond', node: exprNode(s.condition as ExpressionNode) }]
          : []),
        ...(s.update
          ? [
              {
                edge: 'update',
                node: isStmt(s.update) ? stmtNode(s.update) : exprNode(s.update),
              },
            ]
          : []),
        {
          edge: 'body',
          node: mk(
            'Block',
            'statement',
            `${s.body.length} sent.`,
            s.body.map((st, i) => ({ edge: `[${i}]`, node: stmtNode(st) })),
          ),
        },
      ]);
    case 'WhileStatement':
      return mk('WhileStatement', 'statement', undefined, [
        { edge: 'cond', node: exprNode(s.condition) },
        {
          edge: 'body',
          node: mk(
            'Block',
            'statement',
            `${s.body.length} sent.`,
            s.body.map((st, i) => ({ edge: `[${i}]`, node: stmtNode(st) })),
          ),
        },
      ]);
  }
}

export function toUiTree(program: ProgramNode): UiNode {
  uid = 0;
  return mk(`Program: ${program.name}`, 'root', `${program.body.length} sentencia(s)`, [
    {
      edge: 'body',
      node: mk(
        'Body',
        'statement',
        undefined,
        program.body.map((s, i) => ({ edge: `[${i}]`, node: stmtNode(s) })),
      ),
    },
  ]);
}

function countNodes(n: UiNode): number {
  return 1 + n.children.reduce((acc, c) => acc + countNodes(c.node), 0);
}

export function collectKeys(n: UiNode, out: string[] = []): string[] {
  out.push(n.key);
  n.children.forEach((c) => collectKeys(c.node, out));
  return out;
}

export function countUiNodes(n: UiNode): number {
  return 1 + n.children.reduce((acc, c) => acc + countUiNodes(c.node), 0);
}

function matches(n: UiNode, q: string): boolean {
  const s = `${n.title} ${n.subtitle ?? ''}`.toLowerCase();
  return s.includes(q);
}

function TreeItem({
  edge,
  node,
  depth,
  collapsed,
  toggle,
  query,
}: {
  edge: string;
  node: UiNode;
  depth: number;
  collapsed: Set<string>;
  toggle: (key: string) => void;
  query: string;
}) {
  const isCollapsed = collapsed.has(node.key);
  const hasKids = node.children.length > 0;
  const hit =
    query.trim().length > 0 && matches(node, query.trim().toLowerCase());

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-1 py-[3px] flex-wrap rounded-md ${
          hit ? 'bg-blue-600/20' : ''
        }`}
      >
        {hasKids ? (
          <button
            className="w-[22px] h-[22px] rounded-md border border-[#2c3a52] bg-[#1a2230] text-[#c9d3e0] cursor-pointer leading-none"
            onClick={() => toggle(node.key)}
            aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span className="text-[#3f4f6d] w-[22px] text-center">•</span>
        )}
        <span className="text-[#7d8aa0] font-mono text-xs min-w-[52px]">{edge}</span>
        <span className={astPillClass(node.kind)}>{node.title}</span>
        {node.subtitle && (
          <span className="text-[#aeb9ca] font-mono text-xs">{node.subtitle}</span>
        )}
        {hasKids && (
          <span className={astCountClass}>{node.children.length}</span>
        )}
      </div>
      {hasKids && !isCollapsed && (
        <div className="ml-[11px] pl-3 border-l border-dashed border-[#2c3a52]">
          {node.children.map((c) => (
            <TreeItem
              key={c.node.key}
              edge={c.edge}
              node={c.node}
              depth={depth + 1}
              collapsed={collapsed}
              toggle={toggle}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AstTree({ ast }: { ast: ProgramNode }) {
  const tree = useMemo(() => toUiTree(ast), [ast]);
  const allKeys = useMemo(() => collectKeys(tree), [tree]);
  const total = useMemo(() => countNodes(tree), [tree]);

  // Colapsado por defecto a partir de profundidad 2: expandimos root + body.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    // Al cambiar de programa, resetea el colapso (colapsa nodos profundos).
    const keep = new Set<string>();
    const visit = (n: UiNode, d: number) => {
      if (d >= 3) keep.add(n.key);
      n.children.forEach((c) => visit(c.node, d + 1));
    };
    visit(tree, 0);
    setCollapsed(keep);
    setQuery('');
    setShowJson(false);
  }, [tree]);

  // Si hay búsqueda, auto-expande todo para ver los hits.
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

  const raw: ASTNode = ast;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <input
          className={searchInputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar nodos… (ej. IfStatement, push)"
        />
        <div className="flex gap-2 flex-wrap">
          <button className={miniBtnClass} onClick={() => setCollapsed(new Set())}>
            Expandir todo
          </button>
          <button
            className={miniBtnClass}
            onClick={() => setCollapsed(new Set(allKeys))}
          >
            Colapsar todo
          </button>
          <button className={miniBtnClass} onClick={() => setShowJson((v) => !v)}>
            {showJson ? 'Ver árbol' : 'Ver JSON'}
          </button>
        </div>
      </div>
      <div className={astMetaClass}>
        {total} nodo(s) · {collapsed.size} colapsado(s)
      </div>

      {showJson ? (
        <pre className="bg-[#0b0f16] border border-[#2b3850] rounded-lg p-3 text-xs overflow-auto">
          {JSON.stringify(raw, null, 2)}
        </pre>
      ) : (
        <div className={`${panelBoxClass} px-2.5 py-2.5 text-[13px]`}>
          {/* raíz sin edge */}
          <TreeItem
            edge="root"
            node={tree}
            depth={0}
            collapsed={collapsed}
            toggle={toggle}
            query={query}
          />
        </div>
      )}
    </div>
  );
}
