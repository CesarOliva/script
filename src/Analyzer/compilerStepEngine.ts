import { Lexer, Token, TokenType } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer, SemanticError, type StatementTrace } from './semanticAnalyzer';
import type { ExpressionNode, ProgramNode, StatementNode } from './ast';
import type { SymbolEntry } from './symbolTable';

export type StepPhase = 'inicio' | 'lexer' | 'parser' | 'semantico' | 'fin' | 'error';
export type StepErrorKind = 'léxico' | 'sintáctico' | 'semántico';

export interface StepCompilerError {
  kind: StepErrorKind;
  message: string;
  line?: number;
  column?: number;
}

export interface StepSnapshot {
  /** Índice 0-based del paso actual. */
  stepIndex: number;
  /** Total de pasos de la sesión. */
  totalSteps: number;
  /** Línea 1-based activa en el editor para este paso. */
  currentCodeLine: number;
  /** Texto de la línea activa (útil para la UI). */
  sourceLineText: string;
  /** Subconjunto de tokens consumidos hasta este paso (sin EOF salvo paso final). */
  tokensProcessed: Token[];
  /** Rama del AST construida hasta este punto (null si hay error previo). */
  astPartial: ProgramNode | null;
  /** Copia limpia del estado de la tabla de símbolos hasta este paso. */
  symbolTableState: SymbolEntry[];
  /** Scopes/ámbitos activos inferidos (p. ej. [0] o [0,1] dentro de un bloque). */
  activeScopes: number[];
  /** Errores acumulados (léxicos, sintácticos o semánticos) hasta este punto. */
  errors: StepCompilerError[];
  /** Errores que aparecen por primera vez en este paso (para resaltar en rojo). */
  newErrors: StepCompilerError[];
  /** Explicación breve de lo que ocurre en esta fase. */
  explanationText: string;
  /** Fase dominante del paso (para badges en la UI). */
  phase: StepPhase;
  /** Tipo de sentencia del paso (si aplica). */
  statementKind?: string;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function extractSyntaxLine(message: string): number | undefined {
  const m = message.match(/L[ií]nea\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : undefined;
}

function statementSignature(stmt: StatementNode): string[] {
  // Palabras clave para localizar la línea de la sentencia en el fuente.
  switch (stmt.type) {
    case 'VariableDeclaration':
      return [stmt.varType.split('<')[0].split('[')[0], stmt.name];
    case 'ConstantDeclaration':
      return ['const', stmt.name];
    case 'Assignment':
      return [stmt.target, '='];
    case 'PrintStatement':
      return ['print'];
    case 'ReadStatement':
      return ['read', stmt.target];
    case 'IfStatement':
      return ['if'];
    case 'ForStatement':
      return ['for'];
    case 'WhileStatement':
      return ['while'];
    case 'ExpressionStatement':
      return [';'];
    default:
      return [];
  }
}

/** Localiza la línea (1-based) de una sentencia buscando secuencialmente. */
function locateStatementLine(
  stmt: StatementNode,
  lines: string[],
  fromLine: number,
): number {
  const keys = statementSignature(stmt).filter(Boolean);
  for (let i = fromLine - 1; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('//')) continue;
    if (keys.length === 0) return i + 1;
    const lower = line.toLowerCase();
    const matchesAll = keys.every((k) =>
      k === ';' ? line.includes(';') : lower.includes(k.toLowerCase()),
    );
    if (matchesAll) return i + 1;
  }
  return Math.min(fromLine, lines.length || 1);
}

function describeStatement(stmt: StatementNode, scopeHint: number): string {
  switch (stmt.type) {
    case 'VariableDeclaration':
      return `[Semántico] Registrando '${stmt.varType} ${stmt.name}' en Scope ${scopeHint}` +
        (stmt.initializer ? ' · verificando tipo del inicializador' : ' · sin inicializador');
    case 'ConstantDeclaration':
      return `[Semántico] Registrando 'const ${stmt.varType} ${stmt.name}' en Scope ${scopeHint} (inmutable)`;
    case 'Assignment':
      return `[Semántico] Asignando valor a '${stmt.target}' · verificando tipos` +
        (stmt.index ? ' · índice debe ser int' : '');
    case 'PrintStatement':
      return `[Semántico] Evaluando expresión de 'print(...)'`;
    case 'ReadStatement':
      return `[Semántico] Verificando 'read(${stmt.target})' · la variable debe existir y ser mutable`;
    case 'IfStatement':
      return `[Semántico] Evaluando condición del 'if' (debe ser bool) · entra a un nuevo Scope`;
    case 'ForStatement':
      return `[Semántico] Analizando 'for' (init, condición bool, update) · entra a un nuevo Scope`;
    case 'WhileStatement':
      return `[Semántico] Evaluando condición del 'while' (debe ser bool) · entra a un nuevo Scope`;
    case 'ExpressionStatement':
      return `[Semántico] Evaluando sentencia de expresión (p. ej. llamada a método push/pop)`;
    default:
      return `[Semántico] Procesando sentencia ${(stmt as { type: string }).type}`;
  }
}

function toStepErrors(list: SemanticError[]): StepCompilerError[] {
  return list.map((e) => ({ kind: 'semántico' as const, message: e.message, line: e.line, column: e.column }));
}

// ---------------------------------------------------------------------------
// Localización de sentencias por tokens (robusta ante líneas repetidas)
// ---------------------------------------------------------------------------

function varTypeKeyword(varType: string): TokenType | null {
  const base = varType.split('<')[0].split('[')[0].trim();
  switch (base) {
    case 'int': return TokenType.int;
    case 'float': return TokenType.float;
    case 'bool': return TokenType.boolean;
    case 'string': return TokenType.string;
    case 'stack': return TokenType.stack;
    case 'queue': return TokenType.queue;
    default: return null;
  }
}

function expressionRootIdentifier(expr: ExpressionNode): string | null {
  switch (expr.type) {
    case 'Identifier': return expr.name;
    case 'MethodCall': return expr.object;
    case 'IndexAccess': return expressionRootIdentifier(expr.array);
    case 'BinaryExpression':
      return expressionRootIdentifier(expr.left) ?? expressionRootIdentifier(expr.right);
    case 'UnaryExpression': return expressionRootIdentifier(expr.argument);
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Reconstrucción incremental del AST parcial a partir de la traza
// ---------------------------------------------------------------------------

/** Clon "caparazón": conserva la cabecera pero vacía los bloques hijos. */
function shellOf(stmt: StatementNode): StatementNode {
  const c = clone(stmt);
  if (c.type === 'IfStatement') {
    c.thenBranch = [];
    delete (c as { elseBranch?: unknown }).elseBranch;
  }
  if (c.type === 'ForStatement' || c.type === 'WhileStatement') {
    (c as { body: StatementNode[] }).body = [];
  }
  return c;
}

/** Inserta el caparazón de una sentencia en el parcial según su ruta ("1.then.0"). */
function insertAtPath(root: ProgramNode, path: string, stmt: StatementNode): void {
  const segs = path.split('.');
  let array: StatementNode[] = root.body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = null;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const last = i === segs.length - 1;

    if (seg === 'then' || seg === 'body') {
      if (!node) return;
      const key = seg === 'then' ? 'thenBranch' : 'body';
      if (!Array.isArray(node[key])) node[key] = [];
      if (last) return;
      array = node[key];
      continue;
    }

    if (seg === 'else') {
      if (!node) return;
      const next = segs[i + 1];
      if (last) {
        node.elseBranch = clone(stmt);
        return;
      }
      if (next !== undefined && /^\d+$/.test(next)) {
        if (!Array.isArray(node.elseBranch)) node.elseBranch = [];
        array = node.elseBranch;
        continue;
      }
      // Rama else-if anidada: navegar dentro del If del else.
      if (!node.elseBranch || Array.isArray(node.elseBranch)) return;
      node = node.elseBranch;
      continue;
    }

    if (/^\d+$/.test(seg)) {
      const idx = parseInt(seg, 10);
      if (last) {
        const shell = shellOf(stmt);
        if (idx <= array.length) array.splice(idx, 0, shell);
        else array.push(shell);
        return;
      }
      node = array[idx];
      if (!node) return;
      continue;
    }
  }
}

function buildPartial(programName: string, entries: StatementTrace[]): ProgramNode {
  const root: ProgramNode = { type: 'Program', name: programName, body: [] };
  for (const e of entries) insertAtPath(root, e.path, e.stmt);
  return root;
}

// ---------------------------------------------------------------------------
// Motor de simulación paso a paso (100% client-side)
// ---------------------------------------------------------------------------

/**
 * CompilerStepEngine: ejecuta Lexer + Parser una vez y luego reconstruye
 * snapshots incrementales re-analizando prefijos del AST.
 *
 * Uso:
 * ```ts
 * const engine = new CompilerStepEngine(source);
 * engine.next(); // avanza
 * engine.current(); // StepSnapshot actual
 * ```
 */
export class CompilerStepEngine {
  private source: string;
  private lines: string[];
  private allTokens: Token[];
  private lexicalErrors: Token[];
  private fullAst: ProgramNode | null = null;
  private syntaxError: string | null = null;
  private syntaxErrorLine: number | undefined;
  private steps: StepSnapshot[] = [];
  private cursor = 0;

  constructor(source: string) {
    this.source = source;
    this.lines = source.split('\n');

    // Fase 1: Lexer (siempre se ejecuta, incluso con errores).
    const lexer = new Lexer(source);
    this.allTokens = lexer.scanTokens();
    this.lexicalErrors = this.allTokens.filter((t) => t.type === TokenType.ERROR);

    // Fase 2: Parser (solo si no hay errores léxicos, igual que compileSource).
    if (this.lexicalErrors.length === 0 && source.trim()) {
      try {
        this.fullAst = new Parser(this.allTokens).parse();
      } catch (e) {
        this.syntaxError = e instanceof Error ? e.message : String(e);
        this.syntaxErrorLine = this.syntaxError ? extractSyntaxLine(this.syntaxError) : undefined;
        this.fullAst = null;
      }
    }

    this.steps = this.buildSteps();
  }

  // -- Navegación del cursor ----------------------------------------------

  /** Snapshot actual. */
  current(): StepSnapshot {
    return this.steps[this.cursor];
  }

  /** Total de pasos. */
  size(): number {
    return this.steps.length;
  }

  /** Índice actual del cursor. */
  position(): number {
    return this.cursor;
  }

  /** Todos los snapshots (solo lectura). */
  getSteps(): StepSnapshot[] {
    return this.steps;
  }

  hasNext(): boolean {
    return this.cursor < this.steps.length - 1;
  }

  hasPrev(): boolean {
    return this.cursor > 0;
  }

  next(): StepSnapshot {
    if (this.hasNext()) this.cursor++;
    return this.current();
  }

  prev(): StepSnapshot {
    if (this.hasPrev()) this.cursor--;
    return this.current();
  }

  goTo(index: number): StepSnapshot {
    this.cursor = Math.max(0, Math.min(index, this.steps.length - 1));
    return this.current();
  }

  restart(): StepSnapshot {
    this.cursor = 0;
    return this.current();
  }

  goToEnd(): StepSnapshot {
    this.cursor = this.steps.length - 1;
    return this.current();
  }

  // -- Construcción de pasos -----------------------------------------------

  private tokensUpTo(line: number, includeEof: boolean): Token[] {
    return this.allTokens.filter(
      (t) => t.line <= line && (includeEof || t.type !== TokenType.EOF),
    );
  }

  private lexicalStepErrors(line: number): StepCompilerError[] {
    return this.lexicalErrors
      .filter((t) => t.line <= line)
      .map((t) => ({
        kind: 'léxico' as const,
        message: `${String(t.literal ?? 'Error léxico')} ('${t.lexeme}')`,
        line: t.line,
        column: t.column,
      }));
  }

  /** Re-ejecuta el analizador semántico sobre un prefijo del programa. */
  private analyzePrefix(programName: string, bodyPrefix: StatementNode[]): {
    symbols: SymbolEntry[];
    errors: StepCompilerError[];
    scopes: number[];
  } {
    const analyzer = new SemanticAnalyzer();
    const prefix: ProgramNode = { type: 'Program', name: programName, body: clone(bodyPrefix) };
    analyzer.analyze(prefix);
    const symbols = clone(analyzer.getSymbolTable().getAllSymbols());
    const maxScope = symbols.reduce((m, s) => Math.max(m, s.scope), 0);
    // Scopes activos: 0 siempre + niveles intermedios si hay símbolos anidados.
    const scopes = Array.from({ length: maxScope + 1 }, (_, i) => i);
    return { symbols, errors: toStepErrors(analyzer.errors), scopes };
  }

  /**
   * Avanza el cursor más allá de la sentencia encontrada para que los
   * argumentos/valores de la línea actual no se confundan con sentencias
   * posteriores (p. ej. el `numeros` de la declaración vs. el de `push`).
   * - Cabeceras if/for/while: salta hasta el ')' que cierra la condición.
   * - Resto: salta hasta el ';' terminador (cubre stack<int>, arrays e inits).
   */
  private advanceCursorPastStatement(stmt: StatementNode, foundIdx: number): number {
    const isHeader =
      stmt.type === 'IfStatement' || stmt.type === 'ForStatement' || stmt.type === 'WhileStatement';
    if (isHeader) return this.skipCallParens(foundIdx + 1);
    return this.skipToAfterSemicolon(foundIdx + 1);
  }

  private skipCallParens(fromIdx: number): number {
    const toks = this.allTokens;
    let open = -1;
    for (let i = fromIdx; i < toks.length; i++) {
      const t = toks[i].type;
      if (t === TokenType.EOF) break;
      if (t === TokenType.leftParen) { open = i; break; }
      if (t === TokenType.semicolon || t === TokenType.leftBrace || t === TokenType.rightBrace) {
        return fromIdx;
      }
    }
    if (open < 0) return fromIdx;
    let depth = 0;
    for (let i = open; i < toks.length; i++) {
      if (toks[i].type === TokenType.leftParen) depth++;
      else if (toks[i].type === TokenType.rightParen) {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
    return fromIdx;
  }

  private skipToAfterSemicolon(fromIdx: number): number {
    const toks = this.allTokens;
    for (let i = fromIdx; i < toks.length; i++) {
      if (toks[i].type === TokenType.EOF) break;
      if (toks[i].type === TokenType.semicolon) return i + 1;
    }
    return fromIdx;
  }
  private findLeadingToken(stmt: StatementNode, fromIdx: number): number {
    const toks = this.allTokens;
    const scan = (pred: (t: Token) => boolean): number => {
      for (let i = fromIdx; i < toks.length; i++) {
        if (toks[i].type === TokenType.EOF) break;
        if (pred(toks[i])) return i;
      }
      return -1;
    };
    switch (stmt.type) {
      case 'VariableDeclaration': {
        const kw = varTypeKeyword(stmt.varType);
        if (!kw) return -1;
        return scan((t) => t.type === kw);
      }
      case 'ConstantDeclaration':
        return scan((t) => t.type === TokenType.const);
      case 'Assignment':
        return scan((t) => t.type === TokenType.identifier && t.lexeme === stmt.target);
      case 'PrintStatement':
        return scan((t) => t.type === TokenType.print);
      case 'ReadStatement':
        return scan((t) => t.type === TokenType.read);
      case 'IfStatement':
        return scan((t) => t.type === TokenType.if);
      case 'ForStatement':
        return scan((t) => t.type === TokenType.for);
      case 'WhileStatement':
        return scan((t) => t.type === TokenType.while);
      case 'ExpressionStatement': {
        const root = expressionRootIdentifier(stmt.expression);
        if (root) {
          const idx = scan((t) => t.type === TokenType.identifier && t.lexeme === root);
          if (idx >= 0) return idx;
        }
        return -1;
      }
      default:
        return -1;
    }
  }

  private pushStep(step: StepSnapshot, prevErrors: StepCompilerError[]): StepCompilerError[] {
    const prevKeys = new Set(prevErrors.map((e) => `${e.kind}:${e.message}`));
    step.newErrors = step.errors.filter((e) => !prevKeys.has(`${e.kind}:${e.message}`));
    this.steps.push(step);
    return step.errors;
  }

  private buildSteps(): StepSnapshot[] {
    this.steps = [];
    const total = { count: 0 };
    const lineText = (n: number) => this.lines[n - 1] ?? '';
    let prevErrors: StepCompilerError[] = [];

    // Fuente vacía: un único paso informativo.
    if (!this.source.trim()) {
      this.steps.push({
        stepIndex: 0,
        totalSteps: 1,
        currentCodeLine: 1,
        sourceLineText: '',
        tokensProcessed: [],
        astPartial: null,
        symbolTableState: [],
        activeScopes: [0],
        errors: [],
        newErrors: [],
        explanationText: '[Lexer] Sin código fuente: escribe un programa para comenzar la simulación.',
        phase: 'inicio',
      });
      return this.steps;
    }

    // -- Caso A: error léxico o sintáctico -> pasos por línea ----------------
    // Sin AST fiable: se avanza línea por línea mostrando tokens + diagnóstico.
    if (this.lexicalErrors.length > 0 || this.syntaxError) {
      const errorLine = this.syntaxErrorLine;
      const meaningful = this.lines
        .map((text, i) => ({ text, n: i + 1 }))
        .filter(({ text }) => text.trim().length > 0);
      const list = meaningful.length > 0 ? meaningful : [{ text: this.lines[0] ?? '', n: 1 }];

      list.forEach(({ text, n }, idx) => {
        const errs: StepCompilerError[] = [
          ...this.lexicalStepErrors(n),
          ...(this.syntaxError && errorLine !== undefined && n >= errorLine
            ? [{ kind: 'sintáctico' as const, message: this.syntaxError, line: errorLine }]
            : this.syntaxError && errorLine === undefined
              ? [{ kind: 'sintáctico' as const, message: this.syntaxError }]
              : []),
        ];
        const failed = errs.length > 0;
        const step: StepSnapshot = {
          stepIndex: total.count,
          totalSteps: 0, // se rellena al final
          currentCodeLine: n,
          sourceLineText: text,
          tokensProcessed: this.tokensUpTo(n, false),
          astPartial: null,
          symbolTableState: [],
          activeScopes: [0],
          errors: errs,
          newErrors: [],
          explanationText: failed
            ? `[Error] La instrucción de la línea ${n} contiene errores (ver consola de diagnóstico).`
            : `[Lexer] Consumiendo tokens de la línea ${n} · sin AST por error en fase previa.`,
          phase: failed ? 'error' : 'lexer',
        };
        prevErrors = this.pushStep(step, prevErrors);
        total.count++;
        void idx;
      });

      this.steps.forEach((s) => (s.totalSteps = this.steps.length));
      return this.steps;
    }

    // -- Caso B: programa válido -> un paso por instrucción (incluye anidadas)
    // La traza semántica emite una entrada por cada sentencia en orden de
    // ejecución, por lo que ninguna línea dentro de if/for/while se salta.
    const ast = this.fullAst!;
    const programName = ast.name;
    const headerLine = Math.max(
      1,
      this.lines.findIndex((l) => l.includes('program')) + 1,
    );

    // Paso 0: cabecera del programa.
    prevErrors = this.pushStep(
      {
        stepIndex: total.count++,
        totalSteps: 0,
        currentCodeLine: headerLine,
        sourceLineText: lineText(headerLine),
        tokensProcessed: this.tokensUpTo(headerLine, false),
        astPartial: { type: 'Program', name: programName, body: [] },
        symbolTableState: [],
        activeScopes: [0],
        errors: [],
        newErrors: [],
        explanationText: `[Lexer/Parser] Cabecera 'program ${programName}' reconocida · Scope 0 creado.`,
        phase: 'inicio',
      },
      prevErrors,
    );

    // Pasos 1..N: una instrucción por paso, incluso dentro de bloques.
    const trace = new SemanticAnalyzer().analyzeWithTrace(clone(ast));
    let tokenCursor = 0;
    let lastLine = headerLine;
    for (let k = 0; k < trace.length; k++) {
      const entry = trace[k];

      // Línea por cursor de tokens (monótono); fallback a búsqueda textual.
      let stmtLine: number;
      const foundTok = this.findLeadingToken(entry.stmt, tokenCursor);
      if (foundTok >= 0) {
        stmtLine = this.allTokens[foundTok].line;
        tokenCursor = this.advanceCursorPastStatement(entry.stmt, foundTok);
      } else {
        stmtLine = locateStatementLine(entry.stmt, this.lines, lastLine);
      }
      lastLine = Math.max(lastLine, stmtLine);

      const partial = buildPartial(programName, trace.slice(0, k + 1));
      const symbols = clone(entry.symbols);
      const scopes = Array.from({ length: entry.scopeLevel + 1 }, (_, i) => i);
      const allErrors: StepCompilerError[] = [
        ...this.lexicalStepErrors(stmtLine),
        ...toStepErrors(entry.errors),
      ];
      const hasError = allErrors.length > prevErrors.length;

      prevErrors = this.pushStep(
        {
          stepIndex: total.count++,
          totalSteps: 0,
          currentCodeLine: stmtLine,
          sourceLineText: lineText(stmtLine),
          tokensProcessed: this.tokensUpTo(stmtLine, false),
          astPartial: partial,
          symbolTableState: symbols,
          activeScopes: scopes.length > 0 ? scopes : [0],
          errors: allErrors,
          newErrors: [],
          explanationText:
            entry.detail +
            (hasError ? ' · ⚠ esta instrucción introduce un error semántico.' : ' · ✓ sin errores.') +
            ` (línea ${stmtLine})`,
          phase: hasError ? 'error' : 'semantico',
          statementKind: entry.stmt.type,
        },
        prevErrors,
      );
    }

    // Paso final: cierre del programa.
    const closingLine = Math.max(lastLine, this.lines.length);
    const full = this.analyzePrefix(programName, ast.body);
    const doneErrors: StepCompilerError[] = [...full.errors];
    prevErrors = this.pushStep(
      {
        stepIndex: total.count++,
        totalSteps: 0,
        currentCodeLine: closingLine,
        sourceLineText: lineText(closingLine),
        tokensProcessed: this.allTokens.filter((t) => t.type !== TokenType.EOF),
        astPartial: clone(ast),
        symbolTableState: full.symbols,
        activeScopes: [0],
        errors: doneErrors,
        newErrors: [],
        explanationText:
          doneErrors.length === 0
            ? `[Fin] Programa completo: ${ast.body.length} instrucción(es), ${full.symbols.length} símbolo(s) · ✅ sin errores.`
            : `[Fin] Programa completo con ${doneErrors.length} error(es) semántico(s) acumulado(s).`,
        phase: doneErrors.length === 0 ? 'fin' : 'error',
      },
      prevErrors,
    );
    void prevErrors;

    this.steps.forEach((s) => (s.totalSteps = this.steps.length));
    return this.steps;
  }
}

export default CompilerStepEngine;
