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

## Language overview (v0.1 spec)

- **Program shape:** `program Identifier { statements }`
- **Primitive types:** `int`, `float`, `bool`, `string`
- **Structured types (planned):** typed arrays (`int[]`), `stack<T>`, `queue<T>`
- **Declarations:** `int x = 10;`, `int x;`, `const int MAX = 100;`
- **Assignment:** `x = expr;`
- **Control flow:** `if / else` (with `else if` via nesting), C-style `for (init; cond; update)`
- **I/O:** `read(variable);`, `print(expression);`
- **Operators:** `+ - * / %`, `== != < <= > >=`, `&& || !`, with C-like precedence
- **Comments:** single-line `//` only
- **Statement terminator:** `;` (blocks don't need it)

Out of scope for v0.1: user-defined functions, `while`, classes, modules, type inference.

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

1. Valid program → prints generated AST.
2. Lexical error (`@`) → reports `ERROR` tokens.
3. Syntactic error (missing `;` / unsupported `while`) → reports parser error with line/column.

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
│ Syntax Analyzer  │  src/parser.ts + src/ast.ts — partially implemented
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

> This section is maintained as the project evolves. Last updated: 2026-09-17.

| Phase | Status | Notes |
|---|---|---|
| 1. Language / lexical / syntactic spec | ✅ Done | v0.1 specs in `documentation/` (language, lexical, EBNF syntax) |
| 2. Lexer (`src/lexer.ts`) | ✅ Implemented | Keywords, identifiers, int/float/bool/string literals, operators (`+ - * / % = == != < <= > >= && \|\| !`), delimiters `() {} [] ;`, `//` comments, `EOF`, line/column tracking, `ERROR` recovery tokens |
| 3. Parser + AST (`src/parser.ts`, `src/ast.ts`) | 🟡 Partial | Recursive descent. Supports: `program`, var/const declarations, assignment, `if/else`, `for`, `print`/`read`, full expression precedence. **Not yet:** arrays (`[]` literals/indexing), `stack`/`queue`, method calls (grammar defines them, parser doesn't) |
| 4. Semantic analyzer | ⬜ Not started | Symbol table, scopes, type checking |
| 5. Intermediate code | ⬜ Not started | Three-address code with temporals/labels |
| 6. Optimizer | ⬜ Not started | Constant folding/propagation, DCE (planned) |
| 7. JS code generator | ⬜ Not started |  |
| 8. CLI + test suite | 🟡 Partial | Only `npm test` harness (`src/tests.ts`) with 3 manual cases; no CLI yet |

### Known spec ↔ implementation gaps

- Spec uses `bool`; implementation uses `boolean` keyword (`src/lexer.ts:82-83`).
- `stack` / `queue` keywords are commented out in the lexer; no array/comma/dot support yet (`src/lexer.ts:9-10,143-145`).
- `while` is intentionally out of scope and correctly rejected by the parser (covered by test case 3).
- Error messages are in Spanish with line/column info.

## Roadmap

1. Complete parser coverage: arrays, `stack<T>` / `queue<T>`, method calls (`push`, `pop`, `enqueue`, ...).
2. Align `bool` vs `boolean` naming between spec and implementation.
3. Semantic analyzer (symbol table + scopes + type checking).
4. IR generation → optimizer → JS code generation.
5. Real CLI (`compiler program.lang → program.js`) + automated test suite.

## Documentation

- `documentation/1-Especificacion_LenguajeDeProgramacion.md` — language definition, types, statements, roadmap.
- `documentation/2-Especificacion_Lexica_Formal.md` — tokens, regexes, maximal munch, acceptance criteria.
- `documentation/3-Especificacion_Sintactica_Formal.md` — EBNF grammar and precedence table.
- `documentation/LexerExp.md`, `ParserExp.md`, `ASTExp.md` — implementation explanations.
