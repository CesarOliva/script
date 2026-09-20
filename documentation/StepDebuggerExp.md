# Modo Paso a Paso — `StepDebugger.tsx`, `compilerStepEngine.ts` y traza de `semanticAnalyzer.ts`

Este documento explica la implementación del **modo interactivo estilo "Jupyter Notebook paso a paso"** del playground. Su objetivo es permitir al usuario ejecutar el código fuente **instrucción por instrucción** —incluyendo las anidadas dentro de bloques `if` / `for` / `while` / `else`— y visualizar en tiempo real la evolución interna del compilador a nivel de Lexer, Parser, AST, Tabla de Símbolos y Analizador Semántico. Todo es **100% client-side** (TypeScript en el navegador, sin backend).

El funcionamiento se reparte en tres piezas que se describen abajo:

1. `src/Analyzer/semanticAnalyzer.ts` → nueva capacidad de **traza** (`analyzeWithTrace`).
2. `src/Analyzer/compilerStepEngine.ts` → **motor de simulación / Snapshot Engine**.
3. `src/components/StepDebugger.tsx` → **panel de vistas e interfaz de usuario** (puro presentacional: recibe `steps` e `index`; el estado del cursor y los controles viven en `App.tsx`, junto al editor).

```
Fuente ──► Lexer ──► Parser ──► SemanticAnalyzer.analyzeWithTrace ──► StatementTrace[]
                                                                              │
                              CompilerStepEngine ──► StepSnapshot[] ──► StepDebugger (UI)
                                 (líneas por tokens, AST parcial, errores)
```

---

## 1. Cambios en `semanticAnalyzer.ts`: modo traza

El analizador semántico original solo respondía "¿el programa es válido?" (`analyze()` devuelve booleano y acumula `errors`). Para el modo paso a paso necesita responder **"¿qué pasó en cada instrucción, en orden de ejecución?"**. Por eso se agregó un segundo modo de recorrido, sin alterar el comportamiento original.

### 1.1 Nueva interfaz `StatementTrace`

Cada entrada representa **un paso elemental** (una instrucción, incluso anidada):

| Campo | Significado |
|---|---|
| `stmt` | Clon de la sentencia foco del paso. |
| `path` | Ruta jerárquica desde el cuerpo del programa: `"2"`, `"1.then.0"`, `"3.body.1"`, `"1.else"` (un `else if`), `"1.else.then.0"`. |
| `depth` | Profundidad de anidamiento (`0` = top-level). |
| `scopeLevel` | Nivel de scope activo al capturar el snapshot. |
| `detail` | Fragmento explicativo en español (ej. `"[Semántico] Registrando 'int temp' en Scope 1 · verificando tipo del inicializador"`). |
| `symbols` | Copia de los símbolos visibles **justo después** de procesar la sentencia. |
| `errors` | Copia de los errores acumulados hasta ese paso. |

### 1.2 Nuevo método `analyzeWithTrace(program): StatementTrace[]`

Funciona igual que `analyze()`, pero sobre una **tabla de símbolos persistente y propia** (se reinicia al inicio), y con un arreglo `trace` activo durante el recorrido. Al terminar devuelve la traza y desactiva el modo traza. Reglas clave:

* **Arquitectura de recorrido única (sin duplicar lógica):** no se copió el análisis en otro archivo. Los métodos existentes (`visitStatement`, `visitIfStatement`, `visitForStatement`, `visitWhileStatement` y los visitantes hoja) aceptan ahora parámetros opcionales `path` y `depth`, y emiten entradas de traza mediante `pushTrace()`. Cuando `trace` es `null` (modo `analyze()` clásico) esos pushes son no-ops, por lo que **los tests y el playground clásico se comportan exactamente igual que antes**.
* **Snapshots con scopes aún abiertos:** el snapshot de símbolos de cada paso se captura **antes** del `exitScope()` del bloque que lo contiene. Esto es lo que permite ver `int temp` / `int inner` declaradas dentro de un `if` mientras el cursor está dentro de él; al salir del bloque, las entradas posteriores ya no las incluyen (coherente con la semántica real de destrucción de scopes).
* **Cabeceras de control como pasos propios:** `visitIfStatement` y `visitWhileStatement` verifican la condición (exigiendo `bool`, como siempre), emiten la entrada de cabecera **antes** de abrir el scope del cuerpo, y luego delegan cada sentencia hija a `visitStatement()` con rutas hijas (`${path}.then.${i}`, `${path}.else.${i}`, `${path}.body.${i}`). Los `else if` se recursan con ruta `${path}.else`.
* **`for` en un solo paso de cabecera:** el `init` (`int i = 0`) y el `update` (`i = i + 1`) comparten la línea del `for`, así que se procesan con la traza temporalmente suspendida (`traceSuspended++`, sin entrada propia) y sus efectos (símbolo `i`, errores de tipos) quedan incluidos en el snapshot de la entrada de cabecera del `for`. Las sentencias del cuerpo sí generan sus propias entradas.
* **Contexto de traza para visitantes hoja:** `visitStatement()` guarda `tracePath`/`traceDepth` antes de despachar, de modo que los visitantes hoja (`VariableDeclaration`, `Assignment`, `Print`, `Read`, `ExpressionStatement`, constantes) emiten su entrada al final con la ruta correcta, sin cambiar sus firmas.
* **Mejora colateral:** `analyze()` ahora también reinicia su `SymbolTable` interna, de modo que reutilizar una instancia no arrastra símbolos de un análisis anterior.

### 1.3 Generación de explicaciones (`traceDetail`)

Cada entrada lleva su `detail` generado con el nivel de scope real en ese momento (ej. `Scope 1` dentro de un bloque), cubriendo declaraciones, asignaciones, `print`/`read`, condiciones `if`/`for`/`while` y sentencias de expresión (llamadas `push`/`pop`, etc.).

---

## 2. `compilerStepEngine.ts`: motor de simulación / Snapshot Engine

La clase `CompilerStepEngine` convierte el código fuente en una lista ordenada de `StepSnapshot` y expone un **cursor** para navegarla. Se construye una sola vez por cada cambio de fuente (`new CompilerStepEngine(source)`) y es totalmente síncrona y sin dependencias de servidor.

### 2.1 Interfaz `StepSnapshot`

| Campo | Contenido |
|---|---|
| `stepIndex` / `totalSteps` | Posición 0-based y total de pasos de la sesión. |
| `currentCodeLine` / `sourceLineText` | Línea 1-based activa en el editor y su texto (para resaltado). |
| `tokensProcessed` | Subconjunto de tokens con `line <= currentCodeLine` (sin `EOF`, salvo el paso final). |
| `astPartial` | `ProgramNode` con el AST construido **hasta ese punto** (`null` si hubo error léxico/sintáctico previo). |
| `symbolTableState` | Copia limpia de símbolos visibles en ese paso (`name`, `type`, `kind`, `scope`, `mutable`). |
| `activeScopes` | Scopes activos inferidos (`[0]` o `[0, 1]` dentro de un bloque). |
| `errors` / `newErrors` | Errores acumulados hasta el paso, y los que **aparecen por primera vez** en él (para resaltarlos en rojo). |
| `explanationText` | `detail` de la traza + sufijo `✓ sin errores.` / `⚠ esta instrucción introduce un error semántico.` + `(línea N)`. |
| `phase` | `inicio` / `lexer` / `parser` / `semantico` / `fin` / `error` (para badges). |
| `statementKind` | Tipo de sentencia del paso (`IfStatement`, `VariableDeclaration`, …). |

Errores tipados como `StepCompilerError`: `{ kind: 'léxico' | 'sintáctico' | 'semántico', message, line?, column? }`.

### 2.2 Construcción de pasos (`buildSteps`)

* **Fuente vacía:** un único paso informativo.
* **Caso A — error léxico o sintáctico (sin AST fiable):** pasos **línea por línea** (solo líneas no vacías) con tokens filtrados por línea y diagnóstico acumulado. El error sintáctico se extrae del mensaje del parser (`[Línea N, Col M]…`) y se marca desde su línea en adelante.
* **Caso B — programa válido:** paso 0 de cabecera (`program X`, `Scope 0` creado) + **un paso por cada entrada de la traza** (incluidas las anidadas: ya no se salta ninguna línea ejecutable dentro de `while`/`for`/`if`) + paso final de cierre con el AST completo y el balance (`✅ sin errores` o N errores acumulados).

### 2.3 Localización de líneas por cursor de tokens (por qué no se salta nada)

El AST no guarda ubicaciones, así que el motor mapea cada sentencia a su línea consumiendo los tokens **en orden de aparición** con un cursor monótono:

* `findLeadingToken(stmt, fromIdx)` busca el token inicial según el tipo: palabra clave de tipo (`int`, `stack`, …), `const`, `print`/`read`, `if`/`for`/`while`, identificador objetivo (`x` en `x = …`), u objeto de llamada (`numeros` en `numeros.push(…)`).
* `advanceCursorPastStatement()` evita falsos positivos posteriores: las cabeceras `if`/`for`/`while` saltan hasta el `)` que cierra la condición (con conteo balanceado, cubre `size()` anidados y el `init;cond;update` del `for`); el resto salta hasta el `;` terminador (cubre `stack<int>`, arrays e inicializadores). Así `numeros.push(5);` no se confunde con el `numeros` de su declaración, ni `int temp` con el `int` del `init` del `for`.
* Si un patrón no se encuentra, hay fallback a búsqueda textual secuencial (`locateStatementLine`).

Las líneas con solo llaves (`{`, `}`) y la línea `} else {` no generan paso porque **no contienen instrucciones**; el stepping es instrucción por instrucción, no línea física por línea física.

### 2.4 Reconstrucción del AST parcial

A partir del subconjunto de traza `trace[0..k]` se reconstruye el programa parcial: cada entrada inserta su **caparazón** (`shellOf`: conserva la cabecera pero vacía `thenBranch`/`body`/`elseBranch`) en su `path` (`insertAtPath` entiende segmentos `then`/`body`/`else`/índices y ramas `else if`). El resultado es la "rama construida hasta ese punto" que renderiza la vista AST, y se clona en cada paso para que los snapshots sean independientes.

### 2.5 Navegación del cursor

`current()`, `next()`, `prev()`, `goTo(i)`, `restart()`, `goToEnd()`, `hasNext()`/`hasPrev()`, `position()`, `size()` y `getSteps()`. La UI (`StepDebugger`) usa este API a través del índice de paso.

---

## 3. `StepDebugger.tsx` + `App.tsx`: vistas y controles

Componente React presentacional (`src/components/StepDebugger.tsx`, props `{ steps, index }`). El cursor (`stepIndex`, `playing`, auto-play de 1200 ms con `setTimeout`, reinicio al cambiar el fuente y sincronización de `stepLine`) vive en `App.tsx`, que construye el `CompilerStepEngine` con `useMemo`.

### 3.1 Controles (en la columna del editor)

`App.tsx` renderiza, solo en modo paso a paso y encima del `CodeEditor`, una barra ámbar con `[◀ Anterior]`, `[Siguiente ▶]`, `[▶ Play]`/`[⏸ Pausar]`, `[🔄]`, contador `Paso X / N · Línea N`, badge de fase (`phaseLabel`, exportado por `StepDebugger`) y barra de progreso. Así los controles quedan pegados al código que resaltan (`highlightedLine` → overlay ámbar + `▶n` en el gutter).

### 3.2 Explicación del paso (en la columna de vistas)

Bloc con `explanationText` y la línea fuente (`L{n}: …`), en rojo si el paso introduce errores. Encima de las vistas, como contexto del panel visible.

### 3.3 Paneles conmutables (uno visible a la vez, como `Tabs`)

Debajo de los controles hay un `nav` con botones estilo `buttonClass` —`Lexer (n)`, `AST`, `Símbolos (n)`, `Diagnóstico (n)`— que alternan el estado local `view: StepView`. Solo se renderiza el panel activo (cada uno extraído como función —`LexerPanel`, `SymbolsPanel`, `AstPanel`, `DiagnosticsPanel`— que recibe el `snap` actual):

| Panel | Contenido |
|---|---|
| **a) Lexer** | Tabla de `tokensProcessed` (Tipo, Lexema, L:C) con la fila de la línea activa resaltada. |
| **b) AST parcial** | `astPartial` renderizado con el `AstExplorer` existente (mismo grafo D3 reutilizado); mensaje de error si no hay AST en ese paso. |
| **c) Tabla de Símbolos** | `symbolTableState` (`name`, `type`, `kind`, `scope`, `mutable`) más los scopes activos `[0, 1]` en el título. |
| **d) Consola de Diagnóstico** | `errors` acumulados; los de `newErrors` llevan prefijo `🔴 NUEVO en este paso` y borde reforzado; `✓ Sin errores…` si está limpio. |

### 3.4 Integración en `App.tsx`

Botón `🔬 Modo paso a paso` junto a los ejemplos: al activarlo, el editor se mantiene a la izquierda y `<StepDebugger source onActiveLineChange />` **reemplaza las tabs** en la columna derecha (`md:col-span-5`, con su propio scroll interno y los 4 paneles apilados en una sola columna). El `CodeEditor` recibe `highlightedLine` para el resaltado ámbar. Al desactivarlo se vuelve a montar `<Tabs>` con el análisis completo y se limpia la línea resaltada.

---

## 4. Ejemplo de sesión

Para un programa con `while`, `for` con `int i`, `int temp` interno e `if/else` con `int inner`, la sesión genera (además de cabecera y cierre) un paso por cada instrucción en orden: declaración → `push` → cabecera `while` → `print`/`asignación` internas → cabecera `for` (incluye `init`) → `int temp` → `print(temp)` → cabecera `if` → `int inner` → `print(inner)` → `print` del `else`. Cada paso muestra sus tokens hasta su línea, el AST parcial con la rama ya construida, los símbolos visibles en su scope y los errores (si la instrucción introduce uno, aparece marcado como nuevo exactamente en ese paso).
