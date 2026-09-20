# [*TBD*] — Academic Compiler (TypeScript → JavaScript)

An academic compiler written in **TypeScript** that compiles a small, statically-typed language to **JavaScript**.

The goal of the project is to study and demonstrate the classic compiler phases: lexical analysis, syntax analysis, semantic analysis, intermediate representation (IR), optimization, and code generation.

> Language name is still provisional (`script` is the repo / working name). Final language name is TBD — see `documentation/1-Especificacion_LenguajeDeProgramacion.md`.

## Example

```text
program Main {
    const int LIMIT = 5;

    int age = 20;

    if (age >= 18) {
        print("Adult");
    } else {
        print("Minor");
    }

    for (int i = 0; i < LIMIT; i = i + 1) {
        print(i);
    }
}
```

Newly supported stacks/queues (see `src/tests.ts` case 3):

```text
program StackTest {
    stack<int> numbers;
    numbers.push(10);

    while (numbers.size() > 0) {
        print(numbers.pop());
    }
}
```

Newly supported arrays (see `src/tests.ts` case 1):

```text
program ArrayDemo {
    int[] numbers = [10, 20, 30];

    int first = numbers[0];

    numbers[1] = 50;

    print(numbers[1]);
}
```

## Repository structure

```text
script/
├── src/
│   ├── Analyzer/
│   │   ├── lexer.ts             # Lexical analyzer (scanner → Token[])
│   │   ├── ast.ts               # AST node type definitions
│   │   ├── parser.ts            # Recursive-descent parser (Token[] → AST)
│   │   ├── symbolTable.ts       # Symbol table with nested scopes (stack of maps)
│   │   ├── semanticAnalyzer.ts  # Semantic analyzer (AST → type/scope checks + errors)
│   │   ├── compiler.ts          # compileSource() pipeline (lexer → parser → semantic)
│   │   ├── examples.ts          # Preset programs for the playground
│   │   └── tests.ts             # End-to-end tests (lexer + parser + semantic)
│   ├── components/
│   │   ├── CodeEditor.tsx       # VSCode-like editor (line numbers + current-line highlight)
│   │   ├── Tabs.tsx             # Result tabs (tokens / AST / semantic / symbols)
│   │   ├── AstExplorer.tsx      # AST section (header + legend + graph/JSON toggle, owns collapse state)
│   │   ├── AstGraph.tsx         # D3-based vertical AST graph (controlled component)
│   │   └── AstTree.tsx          # UiNode builders (toUiTree) + collectKeys/countUiNodes helpers
│   ├── App.tsx                  # Playground shell (editor + Tabs)
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind base (body bg/color + scrollbar + md overflow lock)
├── documentation/
│   ├── 1-Especificacion_LenguajeDeProgramacion.md  # Language spec v0.1
│   ├── 2-Especificacion_Lexica_Formal.md           # Lexical spec v0.1
│   ├── 3-Especificacion_Sintactica_Formal.md       # Syntactic spec (EBNF) v0.1
│   ├── LexerExp.md    # Lexer implementation notes
│   ├── ParserExp.md   # Parser implementation notes
│   ├── ASTExp.md      # AST notes
│   ├── SymbolTableExp.md      # Symbol table implementation notes
│   └── SemanticAnalyzerExp.md # Semantic analyzer implementation notes
├── package.json
├── tsconfig.json
└── README.md
```

## Language overview (v0.1 spec + implemented extensions)

- **Program shape:** `program Identifier { statements }`
- **Primitive types:** `int`, `float`, `bool`, `string`
- **Structured types (implemented):** parametrized `stack<T>` and `queue<T>` where `T` is a primitive type (`stack<int> numbers;`, `queue<string> names;`)
- **Array types (implemented):** `T[]` where `T` is a primitive type (`int[] numbers = [10, 20, 30];`, `string[] names;`)
- **Array literals (implemented):** `[expr, expr, ...]`, including empty `[]` — e.g. `[10, 20, 30]`, `[true, false]`
- **Index access (implemented):** `array[index]` as an expression — e.g. `int first = numbers[0];`, `print(numbers[1]);`
- **Declarations:** `int x = 10;`, `int x;`, `const int MAX = 100;`, `stack<int> s;`, `int[] arr = [1, 2];`
- **Assignment:** `x = expr;` and indexed assignment `arr[i] = expr;` (e.g. `numbers[1] = 50;` → `Assignment { target, index, value }`)
- **Control flow:** `if / else` (with `else if` via nesting), C-style `for (init; cond; update)`, `while (cond) { ... }`
- **I/O:** `read(variable);`, `print(expression);`
- **Method calls (for `stack`/`queue`):** `obj.method(args)` with comma-separated args — e.g. `numbers.push(10);`, `numbers.pop()`, `numbers.size()`, `q.enqueue(1);`, `q.dequeue()`
- **Operators:** `+ - * / %`, `== != < <= > >=`, `&& || !`, with C-like precedence
- **Delimiters:** `() {} [] ; , .`
- **Comments:** single-line `//` only
- **Statement terminator:** `;` (blocks don't need it; method calls used as statements need `;` via `ExpressionStatement`)

Out of scope for v0.1: user-defined functions, `do-while`, classes, modules, type inference.

Full details: `documentation/1-Especificacion_LenguajeDeProgramacion.md`.

## Requirements

- Node.js (LTS recommended)
- npm

## Setup

```powershell
npm install
```

## Usage

Run the web playground (React + Vite + Tailwind, live lexer → parser → semantic):

```powershell
npm run dev
```

Build the playground for production:

```powershell
npm run build
```

Run the end-to-end test harness (lexer + parser + semantic analyzer):

```powershell
npm test
```

This executes `src/tests.ts` via `ts-node` through the `runSemanticTest()` pipeline
(`Lexer.scanTokens()` → `Parser.parse()` → `SemanticAnalyzer.analyze()`) and covers:

1. Valid `TestValido` program → semantic analysis succeeds. Covers `const`, variables,
   `stack<int>` + `push(5)`, `for`, `if` with `bool` condition, and `print`.
2. Invalid `TestErrores` program → reports 5 accumulated semantic errors without aborting:
   undeclared variable (`y = 20;`), assignment to `const` (`MAX = 200;`),
   non-`bool` `if` condition (`if (x)` with `x: int`), type mismatch on assignment
   (`x = "Hola Mundo";` with `x: int`), and `read(MAX)` into a constant.
3. Out-of-scope `TestScope` program → declares `int temp` inside an `if` block and uses it
   outside; reports `La variable 'temp' no ha sido declarada`, demonstrating scope
   creation/destruction via `enterScope()` / `exitScope()`.

## Architecture

```text
Source Code
     │
     ▼
┌──────────────────┐
│ Lexical Analyzer │  src/lexer.ts   — implemented
└────────┬─────────┘
         │ Token[]
         ▼
┌──────────────────┐
│ Syntax Analyzer  │  src/parser.ts + src/ast.ts — implemented
└────────┬─────────┘
         │ AST
         ▼
┌──────────────────┐
│ Semantic Analyzer│  src/semanticAnalyzer.ts + src/symbolTable.ts — implemented
└────────┬─────────┘
          │ Errors / typed info
         ▼
┌──────────────────┐
│ IR Generator     │  — not started (three-address code)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Optimizer        │  — not started (constant folding, DCE, ...)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Code Generator   │  — not started (JS output)
└──────────────────┘
```

## Current status

> This section is maintained as the project evolves. Last updated: 2026-09-20.

| Phase | Status | Notes |
|---|---|---|
| 1. Language / lexical / syntactic spec | ✅ Done | v0.1 specs in `documentation/` (language, lexical, EBNF syntax). Spec already defines `bool`, `while`, `stack<T>` / `queue<T>`, and method calls |
| 2. Lexer (`src/lexer.ts`) | ✅ Implemented | Keywords `program int float bool string stack queue if else for while const print read true false`, identifiers, int/float/bool/string literals, operators (`+ - * / % = == != < <= > >= && \|\| !`), delimiters `() {} [] ; , .`, `//` comments, `EOF`, line/column tracking, `ERROR` recovery tokens. `[` / `]` already emitted, reused for arrays. `Token` payload field renamed `value` → `lexeme` (`Token { type, lexeme, literal?, line, column }`, commit `32126e8`) |
| 3. Parser + AST (`src/parser.ts`, `src/ast.ts`) | ✅ Implemented | Recursive descent. Supports: `program`, var/const declarations (incl. parametrized `stack<T>` / `queue<T>` with primitive `T`, and array types `T[]` with primitive `T`), simple + indexed assignment (`x = e;`, `arr[i] = e;`), `if/else`, `for`, `while` (condition is now required: `WhileStatementNode.condition: ExpressionNode`, not optional), `print`/`read`, array literals (`[e, ...]` → `ArrayLiteral { elements }`), index access (`a[i]` → `IndexAccess { array, index }`), method calls `obj.method(arg, ...)` → `MethodCall` node (`object`, `method`, `args`), expression statements, full expression precedence. **Out of scope (will not be implemented):** multi-dimensional arrays, `const` of structured/array type, structured types in `for`-init |
| 4. Semantic analyzer (`src/semanticAnalyzer.ts` + `src/symbolTable.ts`) | ✅ Implemented | Visitor over the AST with non-fatal error accumulation (`SemanticError { message, line?, column? }` + `errors[]`, `analyze()` returns `errors.length === 0`). Symbol table as stack-of-maps with `enterScope`/`exitScope` (scopes opened for `if`/`for`/`while` bodies, incl. `then`/`else` branches), `insert` (same-scope redeclaration check) and reverse `lookup` (shadowing-aware). Checks: declaration-before-use, `const` immutability (incl. `read()` into `const`), init/assignment type compatibility, `bool`-only `if`/`for`/`while` conditions, arithmetic vs relational operand compatibility (`== != < <= > >=` → `bool`), logical `&&`/`||` (both sides must be `bool` → `bool`), unary `!` (requires `bool` → `bool`) and unary `-` (requires `int`/`float`, preserves operand type), `int`-only array indices, homogeneous `ArrayLiteral` (empty `[]` defaults to `int[]`), `IndexAccess` element-type resolution (`T[]` → `T`), and `stack<T>`/`queue<T>` method validation (`push`/`pop`/`peek`/`isEmpty`/`size`/`clear`, `enqueue`/`dequeue`/`front`/`isEmpty`/`size`/`clear` with inner-type checks on `push`/`enqueue` and typed returns). `else if` chains handled by recursing into `visitIfStatement()`. `analyze()` accepts `ProgramNode | StatementNode[]` |
| 5. Intermediate code | ⬜ Not started | Three-address code with temporals/labels |
| 6. Optimizer | ⬜ Not started | Constant folding/propagation, DCE (planned) |
| 7. JS code generator | ⬜ Not started |  |
| 8. CLI + test suite | 🟡 Partial | `npm test` harness (`src/tests.ts`) now runs the full lexer → parser → semantic pipeline via `runSemanticTest()` with 3 semantic cases (1 valid + 1 multi-error + 1 scope error); no CLI yet |

### Implemented since the previous README update (2026-09-20 — Tailwind migration + 100vh layout + AST redesign)

- **CSS → Tailwind migration** (`src/index.css`, `src/components/styles.tsx`):
  `index.css` went from ~195 lines to ~25 (only `@import "tailwindcss"`, base
  `html/body/#root` sizing, body bg/color, scrollbar styling). All legacy rules
  (`.layout`, `.header`, `.badge`, `.chip`, `.panels`, `.ast-*`, `.mini-btn`,
  element selectors like `textarea`) were removed and replaced with Tailwind
  utilities. Shared patterns were centralized in `styles.tsx`: `badgeClass()`
  (`ok`/`error`/`neutral`), `miniBtnClass`, `searchInputClass`,
  `panelBoxClass`, `astPillClass()` (+ `astMetaClass`, `astCountClass`).
  SVG presentation in `AstGraph` uses element props (`fill`, `stroke`,
  `fontSize`, `paintOrder`, drop-shadow `filter`) instead of CSS classes.
- **Viewport-locked layout from `md` up** (`src/App.tsx`, `src/components/Tabs.tsx`,
  `src/index.css`): below `md` the page scrolls normally; from `md`
  (`min-width: 768px`) the shell is capped at `100vh` (`md:h-screen
  md:max-h-screen md:overflow-hidden`, `body { overflow: hidden }`) and scrolling
  moves inside the panels — editor and tab content are `md:flex-1 md:min-h-0`
  with internal `overflow-auto` (token/symbol tables, AST canvas).
- **AST section redesign** (`src/components/AstExplorer.tsx`, `src/components/AstGraph.tsx`,
  design reference: `referencia.png`):
  - Section header with violet `⛉` icon, title `Árbol de Sintaxis Abstracta`,
    subtitle `Representación estructurada del programa.`, and dark action buttons
    (`↓ Expandir todo`, `↑ Colapsar todo`, `<> JSON` toggle with active state).
  - Category legend: Programa (blue), Sentencia (green), Expresión (amber),
    Declaración (violet), Otro (gray) — see `CATEGORY_META` in `AstGraph.tsx`.
  - Vertical top-down D3 tree (was horizontal) with orthogonal elbow edges +
    arrow markers, no edge labels. Card nodes (`168×58`, `foreignObject`) with
    per-category icon/tint/border, short labels (`Program`, `ConstDecl`,
    `VarDecl`, `Assign`, `For`, `If`, `Block`, `Call`, … via `displayOf()`),
    truncated subtitles, and a `⌄` chevron for collapsible nodes.
  - The artificial `Body` wrapper is flattened in the view so `Program` connects
    directly to the statements; initial state expands to depth 3 (`For → Block →
    `Call` visible, deeper nodes collapsed). Collapse state is owned by
    `AstExplorer` and `AstGraph` is a controlled component
    (`tree` + `collapsed` + `onToggle`); the old graph/list/JSON mode switch and
    the search box were removed in favor of the reference layout.
  - Canvas with dotted-grid background (`radial-gradient`), `⛶` fullscreen
    button, D3 zoom/pan, double-click to reset zoom.
  - Compact spacing: `DX = 184` (~16 px horizontal air), `DY = 92` (~34 px
    vertical air) — tune these constants in `AstGraph.tsx` to pack nodes
    tighter/looser (floors ≈ `DX 176`, `DY 80` before cards touch).

### Implemented since the previous README update (playground UI — `Tabs` + `CodeEditor`)

- **Result tabs extracted to `src/components/Tabs.tsx`**: `App.tsx` no longer renders the tab
  nav/body inline; it now uses `<Tabs activeTab={tab} onTabChange={setTab} result={result} />`
  with typed props (`TabId = 'tokens' | 'ast' | 'semantic' | 'symbols'`, `result: CompileResult`).
  All tab CSS (`.tabs`, `.tab`, `.tab-body`, `table`/`th`/`td`, `.mono`, `.row-error`,
  `.alert`, `.empty`) was migrated to Tailwind utilities; the legacy rules were removed
  from `src/index.css`. `AstExplorer` mode buttons were migrated to the same Tailwind
  tab-button style so no orphan `.tab` CSS remains.
- **Generic previous-phase error banners**: each tab reports whether a previous phase
  failed without specifying which error, always with the `alertError` style —
  AST on lexical/syntax errors (`No se puede mostrar el AST: hay errores en fases previas.`),
  semantic on lexical/syntax errors, symbols on lexical/syntax/semantic errors.
  Own-phase details are still shown (token error list, semantic error list); the
  success banner (`alertOk`) only renders when there are no previous errors.
  The symbols tab renders exclusively: on previous errors it shows only the banner
  (no table / no "Sin símbolos" underneath). This also fixed a `||`/`&&` precedence
  bug in the semantic tab that rendered the raw `syntaxError` string instead of the banner.
- **Token type badges** (`src/components/Tabs.tsx:35-88`, `tokenTypeColors`): token types
  in the tokens table render as colored pills grouped by family (keywords purple,
  types blue, control flow green, I/O teal, identifiers/literals yellow, operators
  olive, delimiters fuchsia, `EOF` neutral, `ERROR` red).
- **VSCode-like editor (`src/components/CodeEditor.tsx`, used in `App.tsx`)**: replaces
  the plain `<textarea>` with a gutter of line numbers synced to scroll
  (`translateY(-scrollTop)`), active line number highlighted in white/bold, current-line
  highlight (`bg-white/[0.05]` + `border-y border-white/10`, 20 px row at
  `top = 12 + (line-1)*20 - scrollTop`), fixed mono metrics (13 px / 20 px leading,
  `wrap="off"`, `whiteSpace: pre`), Tab inserts two spaces, focus ring turns the
  border blue, plus a tab bar (`main.pys` + traffic dots) and a status bar
  (`Ln X, Col Y · N líneas · N carac. · UTF-8`). The global `textarea { ... }` rule
  was removed from `src/index.css` because unlayered element selectors override
  Tailwind utilities such as `bg-transparent`.

### Implemented since the previous README update (unary + logical operators — `getExpressionType`)

- **Logical `&&` / `||`** (`src/semanticAnalyzer.ts`, caso `BinaryExpression`): ambos operandos deben ser `'bool'`; cada lado infractor se reporta por separado (`El operador '&&' requiere operandos de tipo 'bool', se recibió 'int' en el lado izquierdo`) y la expresión retorna `'bool'`, por lo que funciona en condiciones (`if (a && b)`) y en asignaciones (`bool c = a && b;`, `int y = x && b;` → doble error: operador + asignación).
- **Unary `!` / `-`** (nuevo caso `UnaryExpression`): `!` exige operando `'bool'` y retorna `'bool'` (soporta anidación como `!!a` y `!(a && b)`); `-` exige operando numérico (`'int'`/`'float'`) y retorna el tipo del operando (`int y = -x;`, `float f = -2.5;`). Si el tipo del operando es desconocido (variable no declarada), no se emite error de operador adicional para evitar cascadas.
- Verificado con 11 casos (válidos e inválidos, incl. propagación de tipos y no-cascada) más `npm test` sin regresiones. Detalles en `documentation/SemanticAnalyzerExp.md`.

### Implemented since the previous README update (commit `07b33b4` + fix — `else` branch + `isEmpty`)

- **`else` / `else if` now analyzed** (`src/semanticAnalyzer.ts:133-143`, `visitIfStatement`): `elseBranch` as `StatementNode[]` is visited in its own `enterScope()`/`exitScope()` block; `else if` (`elseBranch` as `IfStatementNode`) recurses into `visitIfStatement()`. Verificado: un error solo en el `else` (`y = 20;` con `y` no declarada) ahora se reporta, y un error en el `then` se reporta exactamente una vez.

### Implemented since the previous README update (2026-09-18 → 2026-09-19, commits `32126e8`, `01c4044`, `8468250` — semantic analyzer)

- **Symbol table** (`src/symbolTable.ts`, new): `SymbolEntry { name, type, kind ('variable'|'constant'), scope, mutable }` + `SymbolTable` as `Map[]` stack. `enterScope()` pushes a scope, `exitScope()` pops it, `insert()` rejects same-scope duplicates, `lookup()` searches innermost → global (shadowing-aware). Details in `documentation/SymbolTableExp.md`.
- **Semantic analyzer core** (`src/semanticAnalyzer.ts`, new, `01c4044`): `SemanticAnalyzer.analyze()` → `visitProgram()` → `visitStatement()` dispatcher (`VariableDeclaration`, `ConstantDeclaration`, `IfStatement`, `ForStatement`, `WhileStatement`, `PrintStatement`, `ReadStatement`, `Assignment`, `ExpressionStatement`). Errors accumulate in `errors: SemanticError[]` instead of throwing. Type inference in `getExpressionType()` for `Literal` (int vs float via `Number.isInteger`), `Identifier` (table lookup), and `BinaryExpression` (arithmetic returns operand type, relational returns `bool`). Scope handling: `if`/`for`/`while` bodies run inside `enterScope()`/`exitScope()`. Details in `documentation/SemanticAnalyzerExp.md`.
- **Semantic checks for collections** (commit `8468250`): indexed-assignment index must be `int` and value must match element type (`T[]` → `T`); `IndexAccess` requires `int` index and `T[]` base, returns `T`; `ArrayLiteral` enforces homogeneous element types (empty literal → `int[]`); `MethodCall` validates `stack` methods (`push`, `pop`, `peek`, `isEmpty`, `size`, `clear`) and `queue` methods (`enqueue`, `dequeue`, `front`, `isEmpty`, `size`, `clear`), checking `push`/`enqueue` arity (exactly 1 arg) and inner-type match (`stack<int>.push("s")` → error), with typed returns (`pop`/`peek`/`dequeue`/`front` → `T`, `size` → `int`, `isEmpty` → `bool`, `push`/`enqueue`/`clear` → `void`).
- **`analyze()` input flexibility** (`src/semanticAnalyzer.ts:17-29`): accepts `ProgramNode | StatementNode[]` (single program or bare statement list).
- **Token rename** (commit `32126e8`, `src/lexer.ts`, `src/parser.ts`): `Token.value` → `Token.lexeme` (all constructors and parser accesses updated; `literal`, `line`, `column` unchanged).
- **AST fix** (`src/ast.ts`): `WhileStatementNode.condition` changed from optional (`condition?`) to required (`condition: ExpressionNode`).
- **`src/tests.ts` harness rewrite:** replaced AST-dump / lexical-error harness (`testCompiler()` with `ArrayDemo`, `@` lexical error, `StackTest`) with semantic pipeline harness `runSemanticTest()` (lexer → parser → `SemanticAnalyzer.analyze()`, ✅/❌ + `console.table(analyzer.errors)`). Current cases: `TestValido` (valid, incl. `stack<int> numeros; numeros.push(5);`), `TestErrores` (5 accumulated errors), `TestScope` (use-after-scope). Verified `npm test` passes with 1 success + 2 failing-as-expected cases.

### Implemented in the previous update (2026-09-18 → 2026-09-19, commit `51fa403` — array datatype)

- **Array type declarations** (`src/parser.ts:93-97`): `T[]` where `T` is a primitive (`int`, `float`, `bool`, `string`) — parses optional `[` `]` after the base type and stores `varType: "int[]"` (e.g. `int[] numbers = [10, 20, 30];`).
- **Array literals** (`src/ast.ts:83,117-120`, `src/parser.ts:416-431` in `primary()`): `[expr, ...]` with zero or more comma-separated `expression()` elements, including empty `[]` → `ArrayLiteral { elements }`.
- **Index access expressions** (`src/ast.ts:84,122-126`, `src/parser.ts:451-460` in `primary()`): `identifier[expression]` → `IndexAccess { array, index }`, usable anywhere an expression is expected (e.g. `int first = numbers[0];`, `print(numbers[1]);`).
- **Indexed assignment** (`src/ast.ts:65-70`, `src/parser.ts:259-278`): `identifier[expression] = expression;` → `Assignment { target, index, value }` (e.g. `numbers[1] = 50;`). `statement()` disambiguation extended (`src/parser.ts:78-83`) so `identifier [` routes to `assignmentStatement()` instead of `expressionStatement()`.
- **`src/tests.ts` harness update:** case 1 rewritten from `TestValido` (if/else) to `ArrayDemo` covering declare + literal + index read + indexed write + print; case 3 typo fixed (`sstack<int>` → `stack<int>`).
- **Minor typo fixes in parser errors** (`src/parser.ts:281,465`): `"Se esparaba"` → `"Se esperaba"`.

### Implemented in the previous update (2026-09-17 → 2026-09-18)

- **`while` loop** (`src/parser.ts:62-64,206-218`, `src/ast.ts:14,49-53`): `while (cond) { ... }` with expression condition + block body → `WhileStatement { condition, body }`.
- **`stack` / `queue` keywords** (`src/lexer.ts:9-10,85-86`): previously commented out, now active (`stack`, `queue`).
- **`,` and `.` delimiters** (`src/lexer.ts:47-48,144-145`): previously commented out, now emitted as `comma` / `dot` (required for multi-arg calls and `obj.method()` syntax).
- **Parametrized declarations** (`src/parser.ts:83-113`): `stack<int>`, `queue<string>`, etc. — parses `<primitive>` after `stack`/`queue` and stores it as `varType: "stack<int>"`.
- **`MethodCall` expressions** (`src/ast.ts:81,107-112`, `src/parser.ts:405-433`): `identifier.identifier(args)` in `primary()` — zero or more comma-separated `expression()` args, e.g. `numbers.push(10)`, `numbers.size()`, `numbers.pop()`. Usable as a statement via `ExpressionStatement` (`numbers.push(10);`).
- **`bool` keyword alignment:** type keyword is `bool` (`TokenType.boolean = "bool"`, `src/lexer.ts:7,83`); `true`/`false` produce `booleanLiteral` tokens.

### Known limitations / out of scope (will not be implemented)

- Multi-dimensional arrays (`int[][]`): `variableDeclaration()` only consumes a single `[` `]` pair. Fuera de alcance por decisión de diseño.
- `const` only accepts primitive types: `constantDeclaration()` does not allow `T[]` or `stack<T>` / `queue<T>`. Fuera de alcance por decisión de diseño.
- `for`-init only accepts primitive declarations or assignments: `stack<T>` / `queue<T>` / `T[]` declarations and indexed assignments are not handled in the `for (init; ...)` header (the `update` clause also only handles simple `x = e` assignments, not `arr[i] = e`). Fuera de alcance por decisión de diseño.
- Index access is only single-level and identifier-rooted (`name[expr]`); chained access such as `a[0][1]` parses `a[0]` but leaves a trailing `[1]` unconsumed (consecuencia de no soportar arreglos multidimensionales).


## Roadmap

1. IR generation → optimizer → JS code generation.
2. Real CLI (`compiler program.lang → program.js`) + automated test suite.
3. Semantic follow-ups: harden `for`-init/update coverage.

## Documentation

- `documentation/1-Especificacion_LenguajeDeProgramacion.md` — language definition, types, statements, roadmap.
- `documentation/2-Especificacion_Lexica_Formal.md` — tokens, regexes, maximal munch, acceptance criteria.
- `documentation/3-Especificacion_Sintactica_Formal.md` — EBNF grammar and precedence table.
- `documentation/LexerExp.md`, `ParserExp.md`, `ASTExp.md` — implementation explanations.
- `documentation/SymbolTableExp.md`, `SemanticAnalyzerExp.md` — symbol table and semantic analyzer implementation explanations.
