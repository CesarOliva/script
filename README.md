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
│   ├── lexer.ts    # Lexical analyzer (scanner → Token[])
│   ├── ast.ts      # AST node type definitions
│   ├── parser.ts   # Recursive-descent parser (Token[] → AST)
│   └── tests.ts    # Manual end-to-end tests (lexer + parser)
├── documentation/
│   ├── 1-Especificacion_LenguajeDeProgramacion.md  # Language spec v0.1
│   ├── 2-Especificacion_Lexica_Formal.md           # Lexical spec v0.1
│   ├── 3-Especificacion_Sintactica_Formal.md       # Syntactic spec (EBNF) v0.1
│   ├── LexerExp.md    # Lexer implementation notes
│   ├── ParserExp.md   # Parser implementation notes
│   └── ASTExp.md      # AST notes
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

Run the manual test harness (lexer + parser → AST as JSON):

```powershell
npm test
```

This executes `src/tests.ts` via `ts-node` and covers:

1. Valid `ArrayDemo` program → prints generated AST with `VariableDeclaration(varType: "int[]")`, `ArrayLiteral`, `IndexAccess` (`int first = numbers[0];`), indexed `Assignment` (`numbers[1] = 50;` → `Assignment { target, index, value }`), and `print(numbers[1]);`.
2. Lexical error (`@`) → reports `ERROR` tokens.
3. Valid `stack<int>` + `while` + method-call program (`StackTest`: `stack<int> numbers; numbers.push(10); while (numbers.size() > 0) { print(numbers.pop()); }`) → prints AST with `VariableDeclaration(varType: "stack<int>")`, `MethodCall`, and `WhileStatement` nodes.

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
│ Semantic Analyzer│  — not started (symbol table, type checking)
└────────┬─────────┘
         │ Typed AST
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

> This section is maintained as the project evolves. Last updated: 2026-09-19.

| Phase | Status | Notes |
|---|---|---|
| 1. Language / lexical / syntactic spec | ✅ Done | v0.1 specs in `documentation/` (language, lexical, EBNF syntax). Spec already defines `bool`, `while`, `stack<T>` / `queue<T>`, and method calls |
| 2. Lexer (`src/lexer.ts`) | ✅ Implemented | Keywords `program int float bool string stack queue if else for while const print read true false`, identifiers, int/float/bool/string literals, operators (`+ - * / % = == != < <= > >= && \|\| !`), delimiters `() {} [] ; , .`, `//` comments, `EOF`, line/column tracking, `ERROR` recovery tokens. `[` / `]` already emitted, reused for arrays |
| 3. Parser + AST (`src/parser.ts`, `src/ast.ts`) | ✅ Implemented | Recursive descent. Supports: `program`, var/const declarations (incl. parametrized `stack<T>` / `queue<T>` with primitive `T`, and array types `T[]` with primitive `T`), simple + indexed assignment (`x = e;`, `arr[i] = e;`), `if/else`, `for`, `while`, `print`/`read`, array literals (`[e, ...]` → `ArrayLiteral { elements }`), index access (`a[i]` → `IndexAccess { array, index }`), method calls `obj.method(arg, ...)` → `MethodCall` node (`object`, `method`, `args`), expression statements, full expression precedence. **Out of scope (will not be implemented):** multi-dimensional arrays, `const` of structured/array type, structured types in `for`-init |
| 4. Semantic analyzer | ⬜ Not started | Symbol table, scopes, type checking (incl. `stack`/`queue` element-type checks, array element-type + index-type checks, `bool` conditions) |
| 5. Intermediate code | ⬜ Not started | Three-address code with temporals/labels |
| 6. Optimizer | ⬜ Not started | Constant folding/propagation, DCE (planned) |
| 7. JS code generator | ⬜ Not started |  |
| 8. CLI + test suite | 🟡 Partial | Only `npm test` harness (`src/tests.ts`) with 3 manual cases (2 valid + 1 lexical error); no CLI yet |

### Implemented since the previous README update (2026-09-18 → 2026-09-19, commit `51fa403` — array datatype)

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

1. Semantic analyzer (symbol table + scopes + type checking, incl. `stack`/`queue` generics, array element/index types, and `bool` conditions).
2. IR generation → optimizer → JS code generation.
3. Real CLI (`compiler program.lang → program.js`) + automated test suite.

## Documentation

- `documentation/1-Especificacion_LenguajeDeProgramacion.md` — language definition, types, statements, roadmap.
- `documentation/2-Especificacion_Lexica_Formal.md` — tokens, regexes, maximal munch, acceptance criteria.
- `documentation/3-Especificacion_Sintactica_Formal.md` — EBNF grammar and precedence table.
- `documentation/LexerExp.md`, `ParserExp.md`, `ASTExp.md` — implementation explanations.
