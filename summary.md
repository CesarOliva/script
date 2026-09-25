# PyScript — Resumen del Proyecto

> Compilador académico de un lenguaje pequeño y estáticamente tipado hacia JavaScript, con playground web interactivo. Nombre del lenguaje aún provisional (`script` / PyScript como nombre del repo).

## 1. Datos generales

| Aspecto | Detalle |
|---|---|
| Ubicación | `C:\Users\Cesar\Desktop\Facu\PyScript` |
| Nombre npm | `pyscript` v1.0.0, licencia ISC |
| Lenguaje del compilador | TypeScript (estricto, `ES2020`) |
| Frontend / Playground | React 19 + Vite 8 + Tailwind CSS 4 + D3 7 |
| Entrada web | `index.html` → `src/main.tsx` → `src/App.tsx` |
| Scripts npm | `npm run dev` (playground), `npm run build` (`tsc && vite build`), `npm run preview`, `npm test` (`ts-node -P tsconfig.node.json src/Analyzer/tests.ts`) |
| Estado fases | Léxico ✅, Sintáctico + AST ✅, Semántico + tabla de símbolos ✅, IR ⬜, Optimizador ⬜, Generador JS ⬜, CLI 🟡 parcial (solo harness de tests) |

## 2. Lenguaje (v0.1 + extensiones implementadas)

- **Programa:** `program Identificador { sentencias }`.
- **Tipos primitivos:** `int`, `float`, `bool`, `string`.
- **Tipos estructurados:** `stack<T>` y `queue<T>` con `T` primitivo (ej. `stack<int> numbers;`).
- **Arreglos:** `T[]` con `T` primitivo, literales `[expr, ...]` (incluye `[]` vacío → `int[]`), acceso `a[i]`, asignación indexada `a[i] = expr;`.
- **Declaraciones:** `int x = 10;`, `int x;`, `const int MAX = 100;` (`const` solo primitivas, por decisión de diseño).
- **Control de flujo:** `if / else` (con `else if` por anidamiento), `for (init; cond; update)` estilo C, `while (cond) { ... }`.
- **E/S:** `print(expr);`, `read(var);`.
- **Métodos colecciones:** `obj.metodo(args)` → `push/pop/peek/isEmpty/size/clear` (stack), `enqueue/dequeue/front/isEmpty/size/clear` (queue).
- **Operadores:** aritméticos `+ - * / %`, relacionales `== != < <= > >=`, lógicos `&& || !`, unario `-`, con precedencia estilo C.
- **Léxico:** identificadores, literales int/float/bool/string, delimitadores `() {} [] ; , .`, comentarios `//` solo, `;` obligatorio (bloques no lo llevan).
- **Fuera de alcance:** funciones definidas por usuario, `do-while`, clases, módulos, inferencia de tipos, arreglos multidimensionales, `const` estructurado, declaraciones estructuradas en el `init` del `for`.

## 3. Pipeline del compilador

```text
Código fuente
  → Lexer.scanTokens() : Token[]          (src/Analyzer/lexer.ts)
  → Parser.parse() : ProgramNode (AST)    (src/Analyzer/parser.ts + ast.ts)
  → SemanticAnalyzer.analyze() : bool + SemanticError[] + símbolos
       (src/Analyzer/semanticAnalyzer.ts + symbolTable.ts)
  → (pendiente) IR → Optimizador → Generador JS
```

- `compileSource(source)` (`src/Analyzer/compiler.ts`) orquesta las 3 fases y devuelve `CompileResult { tokens, lexicalErrors, ast, syntaxError, semanticErrors, symbols, ok }`. Corta en errores léxicos/sintácticos; los semánticos se acumulan sin abortar.
- `CompilerStepEngine` (`src/Analyzer/compilerStepEngine.ts`, ~24 KB) simula la compilación instrucción por instrucción para el "Modo paso a paso" (snapshots por línea/fase, AST parcial incremental, 100% client-side, autoplay 1200 ms estilo Jupyter).
- `runSemanticTest()` (`src/Analyzer/tests.ts`) ejecuta el pipeline completo en consola con 3 casos: válido, 5 errores acumulados, error de scope.

## 4. Estructura del repositorio

```text
├── src/
│   ├── Analyzer/
│   │   ├── lexer.ts              # Scanner → Token[] (keywords, literales, operadores, //, ERROR recovery, línea/columna; Token.lexeme)
│   │   ├── ast.ts                # Tipos AST: Program, VarDecl, ConstDecl, If, For, While, Print, Read, Assignment(target,index,value), ExpressionStatement, Binary, Unary, Literal, Identifier, MethodCall, ArrayLiteral, IndexAccess
│   │   ├── parser.ts             # Recursive-descent (~18 KB): program, declaraciones (T[], stack<T>/queue<T>), asignación simple+indexada, if/else, for, while, print/read, literales/arrays, MethodCall, precedencia
│   │   ├── symbolTable.ts        # Pila de scopes (Map[]), SymbolEntry{name,type,kind(variable|constant),scope,mutable}, enter/exitScope, insert (sin duplicados), lookup (shadowing)
│   │   ├── semanticAnalyzer.ts   # Visitor (~22 KB): uso-antes-de-declarar, const inmutable (incl. read), compatibilidad tipos, condiciones bool, operandos aritméticos/relacionales/lógicos, !/-, índices int, ArrayLiteral homogéneo, IndexAccess→T, métodos stack/queue tipados
│   │   ├── compiler.ts           # compileSource() pipeline completo
│   │   ├── compilerStepEngine.ts # Motor paso a paso (StepPhase, StepSnapshot, AST parcial)
│   │   ├── examples.ts           # 5 programas preset: valido, errores, scope, arrays, stack+while
│   │   └── tests.ts              # Harness npm test (3 casos)
│   ├── components/
│   │   ├── CodeEditor.tsx        # Editor estilo VSCode (gutter, highlight línea, tab=2 espacios, barra main.pys + status Ln/Col)
│   │   ├── Tabs.tsx              # Pestañas tokens/AST/semántico/símbolos, badges de colores por familia de token, banners de error de fase previa
│   │   ├── AstExplorer.tsx       # Sección AST (header, leyenda categorías, expandir/colapsar, toggle JSON, dueño del estado colapso)
│   │   ├── AstGraph.tsx          # Árbol D3 vertical (elbows + flechas, cards 168×58, zoom/pan, fullscreen, grid punteado, DX=184 DY=92)
│   │   ├── AstTree.tsx           # toUiTree + helpers (collectKeys/countUiNodes)
│   │   ├── StepDebugger.tsx      # Vista del modo paso a paso
│   │   └── styles.tsx            # Utilidades Tailwind: badgeClass, buttonClass, miniBtnClass, searchInputClass, panelBoxClass, astPillClass
│   ├── App.tsx                   # Shell playground (editor + Tabs/StepDebugger, badge estado global, selector ejemplos, autoplay)
│   ├── main.tsx                  # Entry React
│   ├── index.css                 # Solo Tailwind + base body/scrollbar (~25 líneas)
│   └── vite-env.d.ts
├── documentation/                # Specs v0.1 + notas implementación
│   ├── 1-Especificacion_LenguajeDeProgramacion.md
│   ├── 2-Especificacion_Lexica_Formal.md
│   ├── 3-Especificacion_Sintactica_Formal.md (EBNF)
│   ├── LexerExp.md, ParserExp.md, ASTExp.md
│   └── SymbolTableExp.md, SemanticAnalyzerExp.md, StepDebuggerExp.md
├── index.html, package.json, tsconfig.json, tsconfig.node.json, vite.config.ts
├── dist/ (build), node_modules/, .git/
```

## 5. Playground web (`src/App.tsx`)

- Layout responsive: scroll normal en móvil; desde `md` bloqueado a `100vh` con scroll interno en editor y pestañas.
- Header `PyScript | Playground` + badge de estado global (sin código / errores léxicos / sintáctico / semánticos / compilación correcta).
- Barra de ejemplos (Válido, Errores semánticos, Scope, Arrays, Stack+while) + botón `🔬 Modo paso a paso`.
- Editor con números de línea sincronizados, resaltado de línea activa (integrado con el step engine), archivo virtual (`valido.pys`, `errores.pys`, etc.).
- Pestañas: tokens (tabla con pills de colores por familia), AST (grafo D3 o JSON), semántico (lista errores), símbolos (tabla; solo banner si hubo errores previos).
- Modo paso a paso: Anterior/Siguiente/Play/Pausa/Reset, progreso %, fase (`inicio/lexer/parser/semantico/fin/error`), línea actual resaltada en el editor.

## 6. Tests y ejemplos

- `npm test` → `TestValido` (const+vars+stack+for+if+print, debe pasar), `TestErrores` (5 errores: no declarada, const reasignada, condición no-bool, mismatch tipos, `read` a const), `TestScope` (`temp` declarada en `if` usada fuera).
- `examples.ts` replica esos 3 + `ArrayDemo` (literal, lectura/escritura indexada) + `StackTest` (`push/size/pop` con `while`).

## 7. Historial reciente (git log)

- `f2bc664` colores estructurados en `tokenTypeColors`, `4847e2b` analizador paso a paso estilo Jupyter, `0547726` readme, `c7ae214/7353378/f46d9db/a1ae5b9` migración CSS→Tailwind + layout + estilos editor, `c4d59e4` extracción de `Tabs`, `3609352` visualización web React, `0ea38dd` mover a `src/Analyzer`, más commits de operadores lógicos/unarios, `else`+`isEmpty`, arrays/colas/stacks, analizador semántico y rename `Token.value→lexeme`.

## 8. Roadmap / limitaciones conocidas

1. Generación IR (código de tres direcciones) → optimizador (constant folding, DCE) → generador JS.
2. CLI real (`program.lang → program.js`) + suite automatizada.
3. Endurecer `for`-init/update (hoy solo primitivas/asignación simple).
- Limitaciones intencionales: sin arreglos multidimensionales (`a[0][1]` deja `[1]` sin consumir), `const` solo primitivo, acceso indexado solo `nombre[expr]` de un nivel.
