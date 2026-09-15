# Especificación Léxica Formal

**Lenguaje:** Por definir  
**Versión:** 0.1  
**Estado:** Diseño inicial  
**Documento relacionado:** `lenguaje_programacion_especificacion_v0.1.md`  
**Implementación prevista:** TypeScript  

---

## 1. Propósito

Este documento define formalmente las reglas léxicas del lenguaje de programación.

La especificación léxica establece cómo una secuencia de caracteres del código fuente se transforma en una secuencia de **tokens**, que posteriormente será consumida por el analizador sintáctico.

El analizador léxico será la primera fase del compilador:

```text
Código fuente
     │
     ▼
┌─────────────────────┐
│ Analizador léxico   │
└──────────┬──────────┘
           │
           ▼
        Tokens
           │
           ▼
┌─────────────────────┐
│ Analizador sintáctico│
└─────────────────────┘
```

El analizador léxico será responsable de:

- Reconocer palabras reservadas.
- Reconocer identificadores.
- Reconocer literales.
- Reconocer operadores.
- Reconocer delimitadores.
- Ignorar espacios y saltos de línea cuando corresponda.
- Ignorar comentarios.
- Reportar caracteres o secuencias no válidas.
- Registrar la posición de los tokens para facilitar el manejo de errores.

El analizador léxico no determinará si un programa es semánticamente correcto. Por ejemplo, no será responsabilidad del lexer decidir si una variable `int` recibe un `string`.

---

## 2. Concepto de token

Un token representa una unidad léxica significativa del lenguaje.

Cada token tendrá, como mínimo, la siguiente información:

```text
Token {
    type
    lexeme
    line
    column
}
```

Ejemplo:

**Código fuente:**
```text
int age = 20;
```

**Tokens:**
```text
KEYWORD_INT     "int"       line 1, column 1
IDENTIFIER      "age"       line 1, column 5
ASSIGN          "="         line 1, column 9
INTEGER_LITERAL "20"        line 1, column 11
SEMICOLON       ";"         line 1, column 13
```

---

## 3. Categorías léxicas

Los tokens se dividirán en las siguientes categorías:

- Palabras reservadas.
- Identificadores.
- Literales.
- Operadores.
- Delimitadores.
- Comentarios.
- Espacios en blanco.
- Tokens especiales de control.

Los comentarios y espacios serán reconocidos durante el análisis léxico, pero normalmente no serán entregados al parser.

---

## 4. Alfabeto

El lenguaje utilizará caracteres Unicode como representación de entrada, pero la sintaxis de los identificadores de la versión 0.1 estará restringida inicialmente a caracteres ASCII.

Se consideran:

- **Letras:** `A-Z`, `a-z`
- **Dígitos:** `0-9`
- **Guion bajo:** `_`
- **Caracteres especiales:**
  - `+`, `-`, `*`, `/`, `%`, `=`, `!`, `<`, `>`, `&`, `|`
  - `(`, `)`, `{`, `}`, `[`, `]`
  - `;`, `,`, `.`
  - `"`

El soporte completo de identificadores Unicode queda fuera de la versión 0.1.

---

## 5. Espacios en blanco

Los siguientes caracteres serán considerados espacios en blanco:

- `SPACE`
- `TAB`
- `NEWLINE`
- `CARRIAGE RETURN`

Representación conceptual:

```text
WHITESPACE ::= " " | "\t" | "\n" | "\r"
```

Los espacios en blanco serán ignorados, excepto cuando formen parte de un literal string.

Ejemplo:

```text
int    age    =    20;
```

será léxicamente equivalente a:

```text
int age = 20;
```

Dentro de un string sí se conservarán:

```text
"Hello World"
```

---

## 6. Palabras reservadas

Las palabras reservadas tendrán un significado especial y no podrán utilizarse como identificadores.

Tabla de palabras reservadas:

| Lexema | Token | Descripción |
| :--- | :--- | :--- |
| `program` | `PROGRAM` | Inicio de un programa |
| `int` | `INT` | Tipo entero |
| `float` | `FLOAT` | Tipo flotante |
| `bool` | `BOOL` | Tipo booleano |
| `string` | `STRING` | Tipo cadena |
| `const` | `CONST` | Declaración de constante |
| `true` | `TRUE` | Literal booleano verdadero |
| `false` | `FALSE` | Literal booleano falso |
| `if` | `IF` | Condicional |
| `else` | `ELSE` | Alternativa del condicional |
| `for` | `FOR` | Ciclo |
| `read` | `READ` | Entrada de datos |
| `print` | `PRINT` | Salida de datos |
| `stack` | `STACK` | Tipo pila |
| `queue` | `QUEUE` | Tipo cola |

Las palabras reservadas serán sensibles a mayúsculas y minúsculas.

Por lo tanto:
- `int` es una palabra reservada, mientras que:
- `Int` y `INT` son identificadores potenciales.

---

## 7. Identificadores

Los identificadores se utilizarán para nombrar:
- Programas.
- Variables.
- Constantes.
- Arrays.
- Stacks.
- Queues.

### 7.1 Regla formal

Se propone la siguiente expresión regular:

```text
[A-Za-z_][A-Za-z0-9_]*
```

Por lo tanto:

```text
IDENTIFIER ::= LETTER | "_" (LETTER | DIGIT | "_")*
```

Donde:

```text
LETTER ::= "A" ... "Z" | "a" ... "z"
DIGIT  ::= "0" ... "9"
```

### 7.2 Identificadores válidos
```text
age
counter
total_price
_value
value1
number2
Main
```

### 7.3 Identificadores inválidos
```text
1value
total-price
user.name
hello world
```

### 7.4 Palabras reservadas

Aunque una palabra reservada cumple sintácticamente con el patrón de un identificador, deberá reconocerse como palabra reservada.

Por ejemplo: `if` no producirá `IDENTIFIER("if")`, sino `IF("if")`.

---

## 8. Literales enteros

Los literales enteros representan valores de tipo `int`.

### 8.1 Regla léxica
```text
INTEGER_LITERAL ::= DIGIT+
```

Ejemplos:
```text
0
1
10
100
99999
```

### 8.2 Signo negativo

El signo `-` no formará parte del literal entero.

Por ejemplo, `-25` se tokenizará como:
```text
MINUS
INTEGER_LITERAL("25")
```

Esto permite que el signo sea tratado como un operador durante el análisis sintáctico.

---

## 9. Literales flotantes

Los literales flotantes representan valores de tipo `float`.

Forma inicial:

```text
FLOAT_LITERAL ::= DIGIT+ "." DIGIT+
```

Ejemplos válidos:
```text
0.5
3.14
10.0
100.25
```

Ejemplos inválidos:
```text
.5
10.
3
```

*(Nota: `3` será un `INTEGER_LITERAL`, no un `FLOAT_LITERAL`).*

La notación científica queda fuera de la versión 0.1 (ejemplo no soportado: `1.5e10`).

---

## 10. Literales booleanos

Los valores booleanos serán palabras reservadas: `true` y `false`.

Tokens: `TRUE` y `FALSE`.

Ejemplo:
```text
bool active = true;
```

Tokenización:
```text
BOOL
IDENTIFIER("active")
ASSIGN
TRUE
SEMICOLON
```

---

## 11. Literales string

Los strings estarán delimitados por comillas dobles:

```text
"Hello"
"Hello World"
"123"
```

Regla conceptual:

```text
STRING_LITERAL ::= '"' STRING_CHARACTER* '"'
```

Un string podrá contener espacios (`"Hello World"`) y caracteres como `!`, `?`, `,`, `.`.

### 11.1 Escape sequences

La versión 0.1 soportará inicialmente las siguientes secuencias de escape:

| Secuencia | Significado |
| :--- | :--- |
| `\"` | Comilla doble |
| `\\` | Barra invertida |
| `\n` | Salto de línea |
| `\t` | Tabulación |

Ejemplo:
```text
string message = "Hello\nWorld";
```

El soporte de otras secuencias de escape queda fuera de esta versión.

### 11.2 String sin cierre

Un string que no tenga una comilla de cierre producirá un error léxico.

Ejemplo:
```text
string name = "Cesar;
```

Error:
```text
LEXICAL ERROR:
Unterminated string literal.
```

---

## 12. Operadores

### 12.1 Operadores aritméticos

| Lexema | Token |
| :--- | :--- |
| `+` | `PLUS` |
| `-` | `MINUS` |
| `*` | `MULTIPLY` |
| `/` | `DIVIDE` |
| `%` | `MODULO` |

Ejemplos:
```text
a + b
a - b
a * b
a / b
a % b
```

### 12.2 Operadores relacionales

| Lexema | Token |
| :--- | :--- |
| `==` | `EQUAL_EQUAL` |
| `!=` | `NOT_EQUAL` |
| `<` | `LESS` |
| `>` | `GREATER` |
| `<=` | `LESS_EQUAL` |
| `>=` | `GREATER_EQUAL` |

El lexer deberá reconocer los operadores de dos caracteres como una única unidad. Por ejemplo, `<=` deberá producir `LESS_EQUAL` y no `LESS` seguido de `ASSIGN`.

### 12.3 Operadores lógicos

| Lexema | Token |
| :--- | :--- |
| `&&` | `AND` |
| `\|\|` | `OR` |
| `!` | `NOT` |

Ejemplo:
```text
age >= 18 && active
```

### 12.4 Asignación

| Lexema | Token |
| :--- | :--- |
| `=` | `ASSIGN` |

Ejemplo:
```text
age = 20;
```

*Importante: `=` y `==` son tokens diferentes.*

---

## 13. Delimitadores

Los delimitadores serán:

| Lexema | Token | Uso |
| :--- | :--- | :--- |
| `(` | `LEFT_PAREN` | Expresiones y parámetros de control |
| `)` | `RIGHT_PAREN` | Expresiones y parámetros de control |
| `{` | `LEFT_BRACE` | Inicio de bloque |
| `}` | `RIGHT_BRACE` | Fin de bloque |
| `[` | `LEFT_BRACKET` | Arrays e índices |
| `]` | `RIGHT_BRACKET` | Arrays e índices |
| `;` | `SEMICOLON` | Terminación de instrucciones |
| `,` | `COMMA` | Separación de elementos |
| `.` | `DOT` | Acceso a operaciones de estructuras |

El punto `.` será utilizado en expresiones como:
```text
numbers.push(10);
```

---

## 14. Tokens de tipos estructurados

La sintaxis:
```text
stack<int>
queue<string>
```

utiliza símbolos adicionales. Se reconocerán:

| Lexema | Token |
| :--- | :--- |
| `<` | `LESS` |
| `>` | `GREATER` |

El parser determinará, dependiendo del contexto sintáctico, si `<` y `>` representan operadores relacionales o delimitadores de un tipo parametrizado.

Por ejemplo, `stack<int>` será interpretado sintácticamente como un tipo `stack` parametrizado con `int`. Mientras que `x < y` será interpretado como una comparación. Esta distinción no será responsabilidad del lexer.

---

## 15. Comentarios

### 15.1 Comentarios de una línea

Los comentarios comenzarán con `//` y terminarán al encontrar un salto de línea o el final del archivo.

Ejemplo:
```text
// This is a comment
int age = 20;
```

También podrán aparecer después de una instrucción:
```text
int age = 20; // User age
```

Los comentarios serán ignorados por el lexer.

### 15.2 Comentarios multilínea

Los comentarios multilínea no serán soportados en la versión 0.1. Por lo tanto:
```text
/*
comment
*/
```
no será una construcción válida.

---

## 16. Reglas de reconocimiento

El lexer procesará el código fuente de izquierda a derecha. Para cada posición deberá determinar el token válido más largo. Este principio se conoce como **maximal munch**.

Ejemplo: `>=` deberá reconocerse como `GREATER_EQUAL` y no como `GREATER` seguido de `ASSIGN`. De igual manera, `==` será `EQUAL_EQUAL` y no dos tokens de asignación.

---

## 17. Prioridad de reconocimiento

Cuando existan posibles ambigüedades, el lexer utilizará una prioridad equivalente a:

1. Espacios y comentarios.
2. Operadores de dos caracteres.
3. Operadores de un carácter.
4. Delimitadores.
5. Literales.
6. Identificadores y palabras reservadas.
7. Error léxico.

En la implementación concreta, la lógica podrá organizarse de otra manera siempre que produzca exactamente la misma tokenización.

---

## 18. Tabla completa de tokens

La siguiente tabla representa el conjunto inicial de tokens:

| Categoría | Lexema | Token |
| :--- | :--- | :--- |
| Keyword | `program` | `PROGRAM` |
| Keyword | `int` | `INT` |
| Keyword | `float` | `FLOAT` |
| Keyword | `bool` | `BOOL` |
| Keyword | `string` | `STRING` |
| Keyword | `const` | `CONST` |
| Keyword | `true` | `TRUE` |
| Keyword | `false` | `FALSE` |
| Keyword | `if` | `IF` |
| Keyword | `else` | `ELSE` |
| Keyword | `for` | `FOR` |
| Keyword | `read` | `READ` |
| Keyword | `print` | `PRINT` |
| Keyword | `stack` | `STACK` |
| Keyword | `queue` | `QUEUE` |
| Identifier | *variable* | `IDENTIFIER` |
| Literal | *entero* | `INTEGER_LITERAL` |
| Literal | *flotante* | `FLOAT_LITERAL` |
| Literal | *string* | `STRING_LITERAL` |
| Operator | `+` | `PLUS` |
| Operator | `-` | `MINUS` |
| Operator | `*` | `MULTIPLY` |
| Operator | `/` | `DIVIDE` |
| Operator | `%` | `MODULO` |
| Operator | `=` | `ASSIGN` |
| Operator | `==` | `EQUAL_EQUAL` |
| Operator | `!=` | `NOT_EQUAL` |
| Operator | `<` | `LESS` |
| Operator | `>` | `GREATER` |
| Operator | `<=` | `LESS_EQUAL` |
| Operator | `>=` | `GREATER_EQUAL` |
| Operator | `&&` | `AND` |
| Operator | `\|\|` | `OR` |
| Operator | `!` | `NOT` |
| Delimiter | `(` | `LEFT_PAREN` |
| Delimiter | `)` | `RIGHT_PAREN` |
| Delimiter | `{` | `LEFT_BRACE` |
| Delimiter | `}` | `RIGHT_BRACE` |
| Delimiter | `[` | `LEFT_BRACKET` |
| Delimiter | `]` | `RIGHT_BRACKET` |
| Delimiter | `;` | `SEMICOLON` |
| Delimiter | `,` | `COMMA` |
| Delimiter | `.` | `DOT` |

---

## 19. Token especial EOF

El lexer deberá generar un token especial al alcanzar el final del archivo: `EOF`. Este token no tendrá lexema significativo.

Ejemplo:
```text
int x = 10;
```

Producirá:
```text
INT
IDENTIFIER("x")
ASSIGN
INTEGER_LITERAL("10")
SEMICOLON
EOF
```

El token `EOF` permitirá al parser determinar explícitamente que no existen más tokens.

---

## 20. Ejemplo de tokenización

**Código:**
```text
program Main {

    int age = 20;
    bool active = true;

    if (age >= 18 && active) {
        print("Adult");
    }

}
```

**Secuencia de tokens:**
```text
PROGRAM
IDENTIFIER("Main")
LEFT_BRACE

INT
IDENTIFIER("age")
ASSIGN
INTEGER_LITERAL("20")
SEMICOLON

BOOL
IDENTIFIER("active")
ASSIGN
TRUE
SEMICOLON

IF
LEFT_PAREN
IDENTIFIER("age")
GREATER_EQUAL
INTEGER_LITERAL("18")
AND
IDENTIFIER("active")
RIGHT_PAREN

LEFT_BRACE

PRINT
LEFT_PAREN
STRING_LITERAL("Adult")
RIGHT_PAREN
SEMICOLON

RIGHT_BRACE
RIGHT_BRACE

EOF
```

*(Los saltos de línea y espacios no generan tokens).*

---

## 21. Ejemplo con estructuras

**Código:**
```text
stack<int> numbers;

numbers.push(10);
numbers.push(20);
```

**Tokenización:**
```text
STACK
LESS
INT
GREATER
IDENTIFIER("numbers")
SEMICOLON

IDENTIFIER("numbers")
DOT
IDENTIFIER("push")
LEFT_PAREN
INTEGER_LITERAL("10")
RIGHT_PAREN
SEMICOLON

IDENTIFIER("numbers")
DOT
IDENTIFIER("push")
LEFT_PAREN
INTEGER_LITERAL("20")
RIGHT_PAREN
SEMICOLON

EOF
```

El lexer no necesita saber que `numbers.push` representa una operación de una pila. Esa interpretación corresponde al parser y posteriormente al análisis semántico.

---

## 22. Ejemplos de errores léxicos

### 22.1 Carácter no reconocido
```text
int x = 10 @ 5;
```
El carácter `@` no pertenece al conjunto de tokens de la versión 0.1.

Resultado:
```text
LEXICAL ERROR:
Unexpected character '@'
```

### 22.2 String sin terminar
```text
string name = "Cesar;
```
Resultado:
```text
LEXICAL ERROR:
Unterminated string literal.
```

### 22.3 Float inválido
```text
float value = 10.;
```
La versión 0.1 requiere dígitos después del punto. El lexer deberá reportar el error de acuerdo con la estrategia concreta de recuperación implementada.

### 22.4 Identificador inválido
```text
int 123value = 10;
```
La secuencia no puede producir un identificador porque los identificadores no pueden comenzar con un número.

---

## 23. Recuperación ante errores léxicos

El lexer deberá intentar continuar después de un error para detectar otros errores en el mismo archivo.

Una estrategia inicial será:
1. Registrar el error.
2. Consumir el carácter problemático.
3. Continuar desde la siguiente posición.

Ejemplo:
```text
int x = 10 @ 20;
int y = 30 # 40;
```

El lexer podrá reportar:
```text
Line 1, Column 11:
Unexpected character '@'

Line 2, Column 11:
Unexpected character '#'
```

La estrategia exacta podrá modificarse durante la implementación si se encuentra una mejor recuperación.

---

## 24. Información de posición

Cada token deberá conservar su posición dentro del código fuente. Como mínimo: `line` y `column`.

Ejemplo:
```typescript
Token {
    type: TokenType.IDENTIFIER,
    lexeme: "age",
    line: 4,
    column: 9
}
```

Opcionalmente, el lexer podrá almacenar también `start` y `end` como índices absolutos dentro del texto fuente. Esto será útil para mensajes de error, diagnósticos del compilador, herramientas futuras y visualización de errores.

---

## 25. Separación de responsabilidades

Es importante mantener una separación clara entre las fases.

**El lexer SÍ debe:**
- `"10"` → `INTEGER_LITERAL`
- `"3.14"` → `FLOAT_LITERAL`
- `"true"` → `TRUE`
- `"hello"` → `STRING_LITERAL`
- `"int"` → `INT`
- `"age"` → `IDENTIFIER`
- `">="` → `GREATER_EQUAL`
- `";"` → `SEMICOLON`

**El lexer NO debe:**
- Determinar si `int age = "hello";` es correcto (esto corresponde al análisis semántico).
- Determinar si `if (age > 18) {` está correctamente estructurado sintácticamente (esto corresponde al parser).

---

## 26. Gramática léxica resumida

La especificación léxica puede resumirse mediante las siguientes reglas:

```bnf
LETTER          ::= "A"..."Z" | "a"..."z"
DIGIT           ::= "0"..."9"

IDENTIFIER      ::= (LETTER | "_") (LETTER | DIGIT | "_")*

INTEGER_LITERAL ::= DIGIT+
FLOAT_LITERAL   ::= DIGIT+ "." DIGIT+
STRING_LITERAL  ::= '"' STRING_CHARACTER* '"'

WHITESPACE      ::= " " | "\t" | "\n" | "\r"
LINE_COMMENT    ::= "//" ANY_CHARACTER* NEWLINE
```

*(Los operadores y delimitadores se reconocen mediante sus lexemas definidos en la tabla de tokens).*

---

## 27. Consideraciones para la implementación en TypeScript

La implementación del lexer deberá mantener una posición sobre el código fuente:
- `source`
- `position`
- `line`
- `column`

Conceptualmente:
```typescript
while (!isAtEnd()) {
    scanToken();
}
```

La implementación deberá contar con operaciones equivalentes a:
- `advance()`
- `peek()`
- `peekNext()`
- `match()`

para inspeccionar y consumir caracteres.

La tabla de palabras reservadas podrá representarse mediante un `Map`:
```text
program -> PROGRAM
int     -> INT
float   -> FLOAT
bool    -> BOOL
...
```

El resultado del lexer será una colección: `Token[]`.

---

## 28. Estructura propuesta del token

La representación en TypeScript podrá comenzar con:

```typescript
interface Token {
    type: TokenType;
    lexeme: string;
    line: number;
    column: number;
}
```

El tipo `TokenType` podrá representarse mediante un `enum`:

```typescript
enum TokenType {
    // Keywords
    PROGRAM,
    INT,
    FLOAT,
    BOOL,
    STRING,
    CONST,
    TRUE,
    FALSE,
    IF,
    ELSE,
    FOR,
    READ,
    PRINT,
    STACK,
    QUEUE,

    // Identifiers & Literals
    IDENTIFIER,
    INTEGER_LITERAL,
    FLOAT_LITERAL,
    STRING_LITERAL,

    // Operators
    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,
    MODULO,
    ASSIGN,
    EQUAL_EQUAL,
    NOT_EQUAL,
    LESS,
    GREATER,
    LESS_EQUAL,
    GREATER_EQUAL,
    AND,
    OR,
    NOT,

    // Delimiters
    LEFT_PAREN,
    RIGHT_PAREN,
    LEFT_BRACE,
    RIGHT_BRACE,
    LEFT_BRACKET,
    RIGHT_BRACKET,
    SEMICOLON,
    COMMA,
    DOT,

    // End of File
    EOF
}
```

La estructura exacta podrá modificarse durante la implementación, pero el conjunto conceptual de tokens deberá conservarse.

---

## 29. Pruebas léxicas mínimas

Antes de integrar el lexer con el parser deberán existir pruebas para:

- **Palabras reservadas:** `program`, `int`, `float`, `bool`, `string`, `const`, `true`, `false`, `if`, `else`, `for`, `read`, `print`, `stack`, `queue`
- **Identificadores:** `x`, `age`, `user_name`, `value123`
- **Literales:** `0`, `123`, `3.14`, `true`, `false`, `"hello"`
- **Operadores:** `+`, `-`, `*`, `/`, `%`, `=`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`
- **Delimitadores:** `(`, `)`, `{`, `}`, `[`, `]`, `;`, `,`, `.`
- **Comentarios:** `// comment`
- **Errores:** `@`, `#`, `"unterminated`

---

## 30. Criterios de aceptación del analizador léxico

El analizador léxico de la versión 0.1 deberá:

1. Convertir correctamente el código fuente en tokens.
2. Reconocer todas las palabras reservadas.
3. Diferenciar palabras reservadas de identificadores.
4. Reconocer enteros.
5. Reconocer flotantes.
6. Reconocer booleanos.
7. Reconocer strings.
8. Reconocer los operadores definidos.
9. Reconocer delimitadores.
10. Ignorar espacios y saltos de línea.
11. Ignorar comentarios de una línea.
12. Generar `EOF`.
13. Registrar línea y columna.
14. Detectar caracteres no reconocidos.
15. Detectar strings sin terminar.
16. Aplicar el principio de *maximal munch*.
17. Continuar el análisis después de errores recuperables.

---

## 31. Relación con las siguientes fases

La salida del analizador léxico será la entrada del analizador sintáctico.

```text
SOURCE
   │
   ▼
LEXER
   │
   │ Token[]
   ▼
PARSER
   │
   │ AST
   ▼
SEMANTIC ANALYZER
```

El lexer no deberá depender del AST ni de la tabla de símbolos. La tabla de símbolos comenzará a tener relevancia principalmente durante el análisis semántico.

---

## 32. Decisiones pendientes

La especificación léxica de la versión 0.1 deja algunas decisiones abiertas:

- Si los identificadores podrán utilizar caracteres Unicode en una versión futura.
- Si se incorporarán comentarios multilínea.
- Si se incorporará notación científica para `float`.
- Si se agregarán secuencias de escape adicionales.
- Si se permitirán strings multilínea en futuras versiones.
- Si se agregará un operador de incremento `++`.
- Si se agregarán operadores compuestos como `+=`, `-=`, `*=`, `/=`.
- Si se incorporarán operadores bit a bit.
- Si se agregará `null` u otro valor especial.

Estas características no forman parte de la versión 0.1.

---

## 33. Estado del documento

Esta especificación corresponde a la **Especificación Léxica Formal v0.1**.

Una vez aprobada, será utilizada como referencia para diseñar la gramática sintáctica formal del lenguaje.

El siguiente documento deberá definir:
- Estructura completa de un programa.
- Declaraciones.
- Asignaciones.
- Expresiones.
- Precedencia.
- Condicionales.
- Ciclos `for`.
- Arrays.
- Stacks.
- Queues.
- Entrada y salida.
- Bloques y ámbitos desde el punto de vista sintáctico.

La gramática deberá expresarse formalmente, preferentemente mediante EBNF, para que pueda utilizarse directamente como base del analizador sintáctico.
