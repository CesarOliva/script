# Especificación Sintáctica Formal (v0.1)

**Estado:** Diseño inicial

**Documentos de referencia:**

1. `Especificacion_LenguajeDeProgramacion.md`

2. `Especificacion_Lexica_Formal.md`

**Implementación prevista:** Analizador sintáctico (Parser) en TypeScript


**Representación formal:** Notación EBNF (*Extended Backus-Naur Form*)

---

## 1. Introducción y Notación Formal

Este documento define la **Especificación Sintáctica Formal v0.1** del lenguaje de programación. Basándose en la Especificación Léxica Formal v0.1, describe las reglas que determinan cómo se agrupan los tokens reconocidos por el *lexer* para formar estructuras gramaticales válidas (Árbol de Sintaxis Abstracta / AST).

### Simbología EBNF utilizada

* `::=` Define una regla gramatical.
* `|` Alternativa (OR sintáctico).
* `( ... )` Agrupación.
* `[ ... ]` Elemento opcional (0 o 1 ocurrencia).
* `{ ... }` Repetición (0 o más ocurrencias).
* `"..."` Símbolo terminal (token literal).


* `NOMBRE_TOKEN` Símbolo terminal (token proveniente del analizador léxico).


* `pascalCase / camelCase` Símbolo no terminal (regla de la gramática).

---

## 2. Gramática Formal Completa (EBNF)

```ebnf
(* ========================================================================== *)
(* 1. ESTRUCTURA DEL PROGRAMA Y BLOQUES                                      *)
(* ========================================================================== *)

program ::= "program" IDENTIFIER "{" statementList "}" EOF ;

statementList ::= { statement } ;

block ::= "{" statementList "}" ;


(* ========================================================================== *)
(* 2. INSTRUCCIONES (STATEMENTS)                                              *)
(* ========================================================================== *)

statement ::= variableDeclaration ";"
            | constantDeclaration ";"
            | assignmentStatement ";"
            | ifStatement
            | forStatement
            | readStatement ";"
            | printStatement ";"
            | expressionStatement ";" ;


(* ========================================================================== *)
(* 3. DECLARACIONES Y TIPOS                                                  *)
(* ========================================================================== *)

primitiveType ::= "int" | "float" | "bool" | "string" ;

dataType ::= primitiveType
           | primitiveType "[" "]"
           | "stack" "<" primitiveType ">"
           | "queue" "<" primitiveType ">" ;

variableDeclaration ::= dataType IDENTIFIER [ "=" expression ]
                      | primitiveType "[" "]" IDENTIFIER "=" arrayLiteral ;

constantDeclaration ::= "const" primitiveType IDENTIFIER "=" expression ;


(* ========================================================================== *)
(* 4. ASIGNACIONES                                                           *)
(* ========================================================================== *)

assignmentStatement ::= target "=" expression ;

target ::= IDENTIFIER [ "[" expression "]" ] ;


(* ========================================================================== *)
(* 5. ESTRUCTURAS DE CONTROL                                                 *)
(* ========================================================================== *)

ifStatement ::= "if" "(" expression ")" block [ "else" ( ifStatement | block ) ] ;

forStatement ::= "for" "(" forInit ";" expression ";" forUpdate ")" block ;

forInit ::= variableDeclaration
          | assignmentStatement
          | (* vacío *) ;

forUpdate ::= assignmentStatement
            | expression
            | (* vacío *) ;


(* ========================================================================== *)
(* 6. ENTRADA Y SALIDA                                                       *)
(* ========================================================================== *)

readStatement ::= "read" "(" target ")" ;

printStatement ::= "print" "(" expression ")" ;


(* ========================================================================== *)
(* 7. EXPRESIONES Y PRECEDENCIA DE OPERADORES                                *)
(* ========================================================================== *)

expressionStatement ::= expression ;

expression ::= logicalOrExpr ;

logicalOrExpr ::= logicalAndExpr { "||" logicalAndExpr } ;

logicalAndExpr ::= equalityExpr { "&&" equalityExpr } ;

equalityExpr ::= relationalExpr { ( "==" | "!=" ) relationalExpr } ;

relationalExpr ::= additiveExpr { ( "<" | "<=" | ">" | ">=" ) additiveExpr } ;

additiveExpr ::= multiplicativeExpr { ( "+" | "-" ) multiplicativeExpr } ;

multiplicativeExpr ::= unaryExpr { ( "*" | "/" | "%" ) unaryExpr } ;

unaryExpr ::= ( "!" | "-" ) unaryExpr
            | primaryExpr ;

primaryExpr ::= INTEGER_LITERAL
              | FLOAT_LITERAL
              | STRING_LITERAL
              | "true"
              | "false"
              | target
              | arrayLiteral
              | methodCall
              | "(" expression ")" ;


(* ========================================================================== *)
(* 8. ESTRUCTURAS DE DATOS Y MÉTODOS ESPECIALES                             *)
(* ========================================================================== *)

arrayLiteral ::= "[" [ expression { "," expression } ] "]" ;

methodCall ::= IDENTIFIER "." IDENTIFIER "(" [ expression { "," expression } ] ")" ;

```

---

## 3. Especificación Detallada por Componente

### 3.1 Estructura Completa de un Programa

Un programa debe iniciar obligatoriamente con la palabra reservada `program`, seguida del nombre del programa (identificador) y un único bloque principal de instrucciones encerrado entre llaves `{}`. El archivo debe finalizar inmediatamente con el token `EOF`.

```ebnf
program ::= "program" IDENTIFIER "{" statementList "}" EOF ;

```

### 3.2 Declaraciones

El lenguaje soporta tipado estático y explícito. Se declaran variables (con o sin inicialización) y constantes (las cuales requieren valor inicial obligatorio).

```ebnf
primitiveType       ::= "int" | "float" | "bool" | "string" ;
dataType            ::= primitiveType
                      | primitiveType "[" "]"
                      | "stack" "<" primitiveType ">"
                      | "queue" "<" primitiveType ">" ;

variableDeclaration ::= dataType IDENTIFIER [ "=" expression ]
                      | primitiveType "[" "]" IDENTIFIER "=" arrayLiteral ;

constantDeclaration ::= "const" primitiveType IDENTIFIER "=" expression ;

```

* **Restricción Sintáctica:** Las constantes exigen el modificador `const` seguido de un tipo primitivo y su asignación inicial.



### 3.3 Asignaciones

La asignación asigna el resultado de evaluar una expresión a una variable simple o a una posición específica de un array.

```ebnf
assignmentStatement ::= target "=" expression ;
target              ::= IDENTIFIER [ "[" expression "]" ] ;

```

### 3.4 Expresiones y Precedencia de Operadores

Para evitar la ambigüedad en el parser y garantizar que la jerarquía de evaluación coincida con los requisitos especificados, la gramática implementa la precedencia mediante reglas en cascada (de menor a mayor precedencia):

| Nivel | Operadores / Construcción | Dirección de Asociatividad | Regla Gramatical |
| --- | --- | --- | --- |
| **1 (Menor)** | ` |  | ` |
| **2** | `&&` | Izquierda a Derecha | `logicalAndExpr`<br> |
| **3** | `==`, `!=` | Izquierda a Derecha | `equalityExpr`<br> |
| **4** | `<`, `<=`, `>`, `>=` | Izquierda a Derecha | `relationalExpr`<br> |
| **5** | `+`, `-` | Izquierda a Derecha | `additiveExpr`<br> |
| **6** | `*`, `/`, `%` | Izquierda a Derecha | `multiplicativeExpr`<br> |
| **7** | Unarios: `!`, `-` | Derecha a Izquierda | `unaryExpr`<br> |
| **8 (Mayor)** | Primarios, `()`, llamadas a método, acceso a array | N/A | `primaryExpr`<br> |

### 3.5 Condicionales (`if` / `else`)

Permite la ejecución condicional mediante `if` y opcionalmente `else`. Se habilita de forma nativa la sintaxis `else if` al permitir que la rama de la alternativa sea otra instrucción `ifStatement` sin necesidad de envolverla en llaves adicionales.

```ebnf
ifStatement ::= "if" "(" expression ")" block [ "else" ( ifStatement | block ) ] ;

```

### 3.6 Ciclos `for`

El ciclo `for` cuenta con tres componentes opcionales en su cabecera: inicialización, condición de parada y actualización, separados por punto y coma `;`.

```ebnf
forStatement ::= "for" "(" forInit ";" expression ";" forUpdate ")" block ;
forInit      ::= variableDeclaration | assignmentStatement | (* vacío *) ;
forUpdate    ::= assignmentStatement | expression | (* vacío *) ;

```

### 3.7 Arrays, Stacks y Queues

* **Arrays:** Se pueden declarar vacíos o inicializarse explícitamente usando literales de array `[...]`. El acceso a elementos utiliza la notación de corchetes `array[index]`.


* **Stacks y Queues:** Se declaran mediante sintaxis genérica restringida a tipos primitivos (`stack<T>`, `queue<T>`). Sus operaciones (como `push()`, `pop()`, `enqueue()`, `dequeue()`, `size()`, `isEmpty()`, etc.) se analizan sintácticamente mediante llamadas a métodos.



```ebnf
arrayLiteral ::= "[" [ expression { "," expression } ] "]" ;
methodCall   ::= IDENTIFIER "." IDENTIFIER "(" [ expression { "," expression } ] ")" ;

```

### 3.8 Entrada y Salida

* **`read`:** Recibe como único parámetro un destino válido (`target`), es decir, una variable o una posición de array.


* **`print`:** Imprime el resultado de evaluar cualquier expresión válida (literales, expresiones aritméticas, retornos de `pop()`, etc.).



```ebnf
readStatement  ::= "read" "(" target ")" ;
printStatement ::= "print" "(" expression ")" ;

```

### 3.9 Bloques y Ámbitos Sintácticos

Un bloque se define exclusivamente entre llaves `{ ... }`. Desde la perspectiva sintáctica, delimita una secuencia de sentencias e introduce un nuevo nivel de anidamiento de ámbito que será validado por la tabla de símbolos en el análisis semántico.

```ebnf
block ::= "{" statementList "}" ;

```

---

## 4. Estado y Próximos Pasos

1. **Estado del Documento:** Esta especificación constituye la **Especificación Sintáctica Formal v0.1**.
2. **Validación:** Se confirma que la gramática soporta completamente el programa de prueba de integración presentado en la especificación.


3. **Continuación:** Con la Especificación Léxica y Sintáctica aprobadas, el siguiente paso del plan de desarrollo consiste en iniciar la **Fase 2 y Fase 3 de Implementación en TypeScript**: desarrollo del *Scanner/Lexer* y construcción del *Parser* de descenso recursivo generador del Árbol de Sintaxis Abstracta (AST).