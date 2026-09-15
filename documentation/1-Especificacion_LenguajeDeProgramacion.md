# Especificación del Lenguaje de Programación

**Versión:** 0.1  
**Estado:** Diseño inicial  
**Implementación prevista:** TypeScript  
**Destino de compilación:** JavaScript  
**Nombre del lenguaje:** Por definir

---

## 1. Introducción

Este documento define la especificación inicial de un lenguaje de programación de propósito académico, diseñado para estudiar y demostrar las principales fases de construcción de un compilador.

El compilador será desarrollado utilizando **TypeScript** y tendrá como objetivo transformar programas escritos en este lenguaje a **JavaScript**.

El lenguaje busca mantener una sintaxis sencilla y familiar, pero contar con un sistema de tipos explícito y estructuras de datos suficientes para permitir un análisis léxico, sintáctico y semántico significativo, así como generación de código intermedio, optimización y generación de código objeto.

La primera versión del lenguaje estará enfocada en:

- Variables y constantes.
- Tipos primitivos.
- Expresiones y operadores.
- Arreglos.
- Pilas.
- Colas.
- Estructuras condicionales.
- Ciclos `for`.
- Entrada y salida.
- Manejo de ámbitos.
- Tipado estático y explícito.

Quedan fuera del alcance inicial las funciones definidas por el usuario, ciclos `while`, clases, módulos y mecanismos de inferencia de tipos.

---

# 2. Objetivos del lenguaje

## 2.1 Objetivo general

Diseñar e implementar un lenguaje de programación pequeño, tipado y compilado a JavaScript, utilizando TypeScript como lenguaje de implementación del compilador.

## 2.2 Objetivos específicos

El lenguaje deberá permitir:

1. Declarar y modificar variables.
2. Declarar constantes.
3. Trabajar con valores enteros, flotantes, booleanos y cadenas.
4. Realizar operaciones aritméticas, relacionales y lógicas.
5. Utilizar arreglos tipados.
6. Utilizar pilas tipadas.
7. Utilizar colas tipadas.
8. Ejecutar instrucciones condicionales.
9. Ejecutar ciclos `for`.
10. Leer información proporcionada por el usuario.
11. Mostrar información en la salida estándar.
12. Detectar errores léxicos, sintácticos y semánticos.
13. Generar una representación intermedia del programa.
14. Aplicar optimizaciones sobre dicha representación.
15. Generar JavaScript como código de salida.

---

# 3. Filosofía del lenguaje

El lenguaje seguirá cuatro principios:

### 3.1 Sintaxis sencilla

Las construcciones deberán ser fáciles de leer y escribir.

Ejemplo:

```text
int age = 20;

if (age >= 18) {
    print("Adult");
}
```

### 3.2 Tipado explícito

Toda variable deberá declarar su tipo.

```text
int age = 20;
float price = 15.5;
bool active = true;
string name = "Cesar";
```

No será válido:

```text
age = 20;
```

si `age` no fue declarada previamente.

### 3.3 Tipado estático

Los tipos serán determinados durante el análisis semántico y no podrán cambiar arbitrariamente durante la ejecución.

```text
int value = 10;

value = 20;       // válido
value = "hello";  // error semántico
```

### 3.4 Orientación académica

Las características del lenguaje se seleccionarán buscando que cada una permita estudiar alguna parte relevante del proceso de compilación.

---

# 4. Estructura general de un programa

Todo programa deberá comenzar con la palabra reservada `program`, seguida del identificador del programa y un bloque de instrucciones.

Forma general:

```text
program Identifier {

    statements

}
```

Ejemplo:

```text
program Main {

    int age = 20;

    print(age);

}
```

Un programa no podrá contener funciones, clases ni módulos en esta versión.

---

# 5. Identificadores

Los identificadores se utilizarán para nombrar:

- Variables.
- Constantes.
- Arreglos.
- Pilas.
- Colas.
- Programa.

Reglas propuestas:

- Deben comenzar con una letra.
- Pueden contener letras, números y `_`.
- No pueden comenzar con un número.
- No pueden coincidir con una palabra reservada.
- Son sensibles a mayúsculas y minúsculas.

Ejemplos válidos:

```text
age
counter
total_price
number1
Main
```

Ejemplos inválidos:

```text
1number
total-price
for
```

---

# 6. Palabras reservadas

Las palabras reservadas estarán escritas en inglés.

Versión inicial:

```text
program
int
float
bool
string
const
true
false
if
else
for
read
print
stack
queue
```

Palabras que deliberadamente NO serán reservadas en esta versión:

```text
function
while
class
module
break
continue
```

Estas podrán reconsiderarse en futuras versiones.

---

# 7. Tipos de datos

El lenguaje tendrá cuatro tipos primitivos:

```text
int
float
bool
string
```

Además tendrá tres tipos estructurados:

```text
array
stack
queue
```

---

## 7.1 Integer

Representa números enteros.

Ejemplos:

```text
0
10
25
-100
```

Declaración:

```text
int age = 20;
```

---

## 7.2 Float

Representa números con parte decimal.

Ejemplos:

```text
3.14
10.5
0.25
-12.75
```

Declaración:

```text
float price = 19.99;
```

La notación científica no estará incluida inicialmente.

---

## 7.3 Boolean

Representa valores lógicos.

Valores permitidos:

```text
true
false
```

Ejemplo:

```text
bool active = true;
```

---

## 7.4 String

Representa cadenas de texto.

Las cadenas estarán delimitadas mediante comillas dobles:

```text
string name = "Cesar";
```

Ejemplo:

```text
print("Hello World");
```

En la primera versión se soportará:

- Declaración.
- Asignación.
- Concatenación mediante `+`.
- Comparación.
- Entrada y salida.

---

# 8. Variables

Las variables se declararán indicando explícitamente su tipo.

```text
int counter = 0;
float price = 10.5;
bool active = true;
string name = "Cesar";
```

También podrán declararse sin valor inicial:

```text
int counter;
float price;
bool active;
string name;
```

Una variable sin inicializar deberá recibir un valor antes de ser utilizada en una expresión que requiera su contenido.

Ejemplo:

```text
int value;

value = 10;

print(value);
```

---

# 9. Constantes

Las constantes se declararán mediante `const`.

Sintaxis:

```text
const type identifier = value;
```

Ejemplos:

```text
const int MAX = 100;
const float PI = 3.14159;
const string VERSION = "0.1";
```

Una constante deberá inicializarse al momento de su declaración.

No será posible modificarla posteriormente:

```text
const int MAX = 100;

MAX = 200; // Error semántico
```

---

# 10. Asignación

La asignación utilizará `=`.

```text
int age = 20;

age = 25;
```

El tipo de la expresión asignada deberá ser compatible con el tipo de la variable.

Ejemplo válido:

```text
int x = 10;
x = 20;
```

Ejemplo inválido:

```text
int x = 10;
x = "hello";
```

---

# 11. Literales

El lenguaje tendrá los siguientes literales:

### Enteros

```text
10
-20
0
```

### Flotantes

```text
3.14
10.5
-0.25
```

### Booleanos

```text
true
false
```

### Strings

```text
"hello"
"hello world"
"123"
```

---

# 12. Operadores

## 12.1 Operadores aritméticos

```text
+
-
*
/
%
```

Ejemplos:

```text
int result = 10 + 5;
int result2 = 10 * 2;
int remainder = 10 % 3;
```

El operador `/` podrá producir un resultado `float` cuando corresponda.

La política exacta de conversión entre `int` y `float` deberá definirse en la especificación semántica final.

---

## 12.2 Operadores relacionales

```text
==
!=
<
>
<=
>=
```

El resultado de una comparación será siempre `bool`.

Ejemplo:

```text
bool result = age >= 18;
```

---

## 12.3 Operadores lógicos

```text
&&
||
!
```

Ejemplo:

```text
bool valid = age >= 18 && age < 65;
```

El operando de `&&`, `||` y `!` deberá ser de tipo `bool`.

---

# 13. Precedencia de operadores

La precedencia inicial será, de mayor a menor:

1. Paréntesis.
2. Operador `!`.
3. Multiplicación, división y módulo: `* / %`.
4. Suma y resta: `+ -`.
5. Operadores relacionales: `< > <= >=`.
6. Igualdad: `== !=`.
7. AND lógico: `&&`.
8. OR lógico: `||`.

Ejemplo:

```text
int result = 2 + 3 * 4;
```

deberá interpretarse como:

```text
2 + (3 * 4)
```

---

# 14. Bloques y ámbitos

Los bloques se delimitarán mediante `{` y `}`.

```text
if (condition) {

    int value = 10;

}
```

Cada bloque podrá crear un nuevo ámbito.

Ejemplo:

```text
program Main {

    int x = 10;

    if (x > 5) {

        int y = 20;

        print(y);

    }

    print(y); // Error semántico

}
```

La variable `y` solamente existe dentro del bloque donde fue declarada.

El compilador deberá mantener información de los ámbitos dentro de la tabla de símbolos.

---

# 15. Condicionales

## 15.1 If

Sintaxis:

```text
if (condition) {

    statements

}
```

Ejemplo:

```text
if (age >= 18) {

    print("Adult");

}
```

La condición deberá ser de tipo `bool`.

---

## 15.2 If / else

Sintaxis:

```text
if (condition) {

    statements

} else {

    statements

}
```

Ejemplo:

```text
if (age >= 18) {

    print("Adult");

} else {

    print("Minor");

}
```

No se incluirá inicialmente `else if` como construcción independiente. Podrá representarse mediante `else` seguido de otro `if`.

---

# 16. Ciclo for

El lenguaje utilizará un `for` de tres componentes:

```text
for (initialization; condition; update) {

    statements

}
```

Ejemplo:

```text
for (int i = 0; i < 10; i = i + 1) {

    print(i);

}
```

El `for` estará compuesto por:

1. Inicialización.
2. Condición.
3. Actualización.
4. Cuerpo.

La condición deberá producir un `bool`.

---

# 17. Arrays

Los arreglos serán estructuras tipadas.

Sintaxis:

```text
type[] identifier = [values];
```

Ejemplo:

```text
int[] numbers = [10, 20, 30, 40];
```

También:

```text
float[] prices = [10.5, 20.0, 30.75];
bool[] states = [true, false, true];
string[] names = ["Ana", "Luis", "Cesar"];
```

El tipo de todos los elementos deberá coincidir con el tipo declarado.

Inválido:

```text
int[] numbers = [10, 20, "hello"];
```

---

## 17.1 Acceso a arrays

Los elementos serán accedidos mediante un índice:

```text
numbers[0]
numbers[1]
```

Ejemplo:

```text
int[] numbers = [10, 20, 30];

int value = numbers[1];
```

---

## 17.2 Modificación de arrays

```text
numbers[1] = 50;
```

El valor asignado deberá coincidir con el tipo del array.

---

## 17.3 Índices

Los índices comenzarán en `0`.

El compilador deberá distinguir entre:

- Índice de tipo incorrecto: error semántico.
- Índice fuera de rango: error de ejecución.

---

# 18. Stacks

Las pilas serán estructuras tipadas mediante sintaxis genérica.

```text
stack<int> numbers;
```

También:

```text
stack<float> values;
stack<bool> states;
stack<string> names;
```

Todos los elementos de una pila deberán ser del tipo declarado.

---

## 18.1 Operaciones de stack

### push

Agrega un elemento:

```text
numbers.push(10);
```

### pop

Extrae y devuelve el elemento superior:

```text
int value = numbers.pop();
```

### peek

Devuelve el elemento superior sin eliminarlo:

```text
int value = numbers.peek();
```

### isEmpty

Devuelve `bool`:

```text
bool empty = numbers.isEmpty();
```

### size

Devuelve `int`:

```text
int count = numbers.size();
```

### clear

Elimina todos los elementos:

```text
numbers.clear();
```

---

# 19. Queues

Las colas también serán estructuras tipadas.

```text
queue<int> numbers;
```

Ejemplos:

```text
queue<float> values;
queue<bool> states;
queue<string> names;
```

---

## 19.1 Operaciones de queue

### enqueue

Agrega un elemento al final:

```text
numbers.enqueue(10);
```

### dequeue

Extrae y devuelve el primer elemento:

```text
int value = numbers.dequeue();
```

### front

Devuelve el primer elemento sin eliminarlo:

```text
int value = numbers.front();
```

### isEmpty

```text
bool empty = numbers.isEmpty();
```

### size

```text
int count = numbers.size();
```

### clear

```text
numbers.clear();
```

---

# 20. Entrada

La entrada se realizará mediante:

```text
read(variable);
```

Ejemplo:

```text
int age;

print("Enter your age:");
read(age);
```

`read()` utilizará el tipo declarado de la variable para determinar cómo interpretar la entrada.

Ejemplo:

```text
int age;
float price;
bool active;
string name;

read(age);
read(price);
read(active);
read(name);
```

No será válido utilizar una expresión como destino de `read()`:

```text
read(age + 1); // Error
```

---

# 21. Salida

La salida se realizará mediante:

```text
print(expression);
```

Ejemplos:

```text
print("Hello");
print(10);
print(age);
print(2 + 3);
```

También podrá imprimirse el resultado de operaciones sobre estructuras:

```text
print(numbers.pop());
print(queue.front());
```

---

# 22. Comentarios

Se utilizarán comentarios de una sola línea mediante `//`.

Ejemplo:

```text
// This is a comment

int age = 20; // User age
```

Los comentarios serán ignorados por el analizador léxico.

El soporte de comentarios multilínea queda fuera de la primera versión.

---

# 23. Terminación de instrucciones

Las instrucciones terminarán con `;`.

Ejemplo:

```text
int age = 20;
age = 25;
print(age);
```

Las declaraciones y expresiones independientes deberán utilizar `;`.

Los bloques no requieren punto y coma:

```text
if (age > 18) {
    print("Adult");
}
```

---

# 24. Ejemplo completo

El siguiente programa utiliza varias características del lenguaje:

```text
program Main {

    const int LIMIT = 5;

    string name;
    int age;

    print("Enter your name:");
    read(name);

    print("Enter your age:");
    read(age);

    if (age >= 18) {

        print("Welcome " + name);

    } else {

        print("You are a minor");

    }

    int[] numbers = [10, 20, 30, 40, 50];

    for (int i = 0; i < LIMIT; i = i + 1) {

        print(numbers[i]);

    }

    stack<int> stackNumbers;

    stackNumbers.push(10);
    stackNumbers.push(20);
    stackNumbers.push(30);

    print(stackNumbers.pop());

    queue<int> queueNumbers;

    queueNumbers.enqueue(100);
    queueNumbers.enqueue(200);
    queueNumbers.enqueue(300);

    print(queueNumbers.dequeue());
}
```

---

# 25. Errores semánticos esperados

El compilador deberá ser capaz de detectar, entre otros:

### Variable no declarada

```text
x = 10;
```

### Variable declarada dos veces en el mismo ámbito

```text
int x = 10;
int x = 20;
```

### Asignación incompatible

```text
int x = 10;

x = "hello";
```

### Constante modificada

```text
const int MAX = 10;

MAX = 20;
```

### Condición no booleana

```text
int x = 10;

if (x) {
}
```

### Operación entre tipos incompatibles

```text
int x = 10;
bool active = true;

x + active;
```

### Elemento incorrecto en un stack

```text
stack<int> numbers;

numbers.push("hello");
```

### Elemento incorrecto en un queue

```text
queue<float> values;

values.enqueue(true);
```

### Índice incorrecto

```text
int[] numbers = [1, 2, 3];

numbers[true];
```

### Uso fuera de ámbito

```text
if (true) {

    int x = 10;

}

print(x);
```

---

# 26. Errores de ejecución

Algunos errores no podrán determinarse completamente durante la compilación.

Por ejemplo:

```text
stack<int> numbers;

numbers.pop();
```

La pila podría estar vacía durante la ejecución.

De igual forma:

```text
int[] numbers = [10, 20, 30];

int index;
read(index);

print(numbers[index]);
```

El compilador puede comprobar que `index` sea `int`, pero no necesariamente conocer su valor en tiempo de compilación.

Por ello, los accesos fuera de rango serán responsabilidad del código generado/runtime.

---

# 27. Arquitectura del compilador

El compilador seguirá las fases clásicas:

```text
Source Code
     │
     ▼
┌─────────────────────┐
│ Lexical Analyzer    │
└──────────┬──────────┘
           │
         Tokens
           │
           ▼
┌─────────────────────┐
│ Syntax Analyzer     │
└──────────┬──────────┘
           │
          AST
           │
           ▼
┌─────────────────────┐
│ Semantic Analyzer   │
└──────────┬──────────┘
           │
      Typed AST
           │
           ▼
┌─────────────────────┐
│ Intermediate Code   │
│ Generator           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code Optimizer      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code Generator      │
└──────────┬──────────┘
           │
           ▼
       JavaScript
```

---

# 28. Tabla de símbolos

La tabla de símbolos será utilizada principalmente por el análisis semántico.

Cada símbolo deberá almacenar información como:

```text
name
type
kind
scope
mutable
```

Ejemplo:

```text
name: age
type: int
kind: variable
scope: global
mutable: true
```

Para una constante:

```text
name: MAX
type: int
kind: constant
scope: global
mutable: false
```

Para estructuras tipadas:

```text
name: numbers
type: stack<int>
kind: variable
scope: global
mutable: true
```

La tabla deberá soportar ámbitos anidados.

---

# 29. Manejo de errores

El compilador deberá diferenciar al menos tres categorías:

## Error léxico

Se produce cuando una secuencia de caracteres no forma un token válido.

Ejemplo:

```text
int x = 10 @ 20;
```

## Error sintáctico

Se produce cuando los tokens no cumplen la gramática.

Ejemplo:

```text
int x = ;
```

## Error semántico

La estructura sintáctica es válida, pero el programa no cumple las reglas del lenguaje.

Ejemplo:

```text
int x = "hello";
```

El sistema de errores deberá intentar reportar:

- Tipo de error.
- Mensaje.
- Línea.
- Columna.
- Fragmento relevante del código cuando sea posible.

---

# 30. Código intermedio

El compilador contará con una representación intermedia independiente de JavaScript.

Se propone inicialmente una representación basada en instrucciones de tres direcciones.

Ejemplo:

```text
int x = 10 + 20;
```

Podría transformarse en:

```text
t1 = 10 + 20
x = t1
```

Un `if`:

```text
if (x > 10) {
    print(x);
}
```

podría representarse conceptualmente como:

```text
t1 = x > 10
ifFalse t1 goto L1
print x
L1:
```

El formato exacto del IR será definido durante la implementación.

---

# 31. Optimización

El optimizador trabajará sobre el código intermedio.

Algunas optimizaciones candidatas para la primera versión:

- Constant folding.
- Eliminación de operaciones redundantes.
- Simplificación de expresiones.
- Propagación de constantes sencilla.
- Eliminación de código inalcanzable cuando sea detectable.

Ejemplo:

```text
int x = 10 + 20;
```

Antes:

```text
t1 = 10 + 20
x = t1
```

Después:

```text
x = 30
```

La optimización deberá preservar el comportamiento del programa.

---

# 32. Generación de código

La salida final del compilador será JavaScript.

Ejemplo del lenguaje:

```text
program Main {

    int x = 10;

    print(x);

}
```

Podría generar:

```javascript
const x = 10;

console.log(x);
```

Las estructuras propias del lenguaje podrán implementarse mediante representaciones equivalentes en JavaScript.

Por ejemplo, una pila podría generarse utilizando un arreglo de JavaScript y operaciones equivalentes.

---

# 33. Elementos fuera del alcance de la versión 0.1

Para evitar que el proyecto crezca de manera innecesaria, la primera versión NO incluirá:

- Funciones definidas por el usuario.
- Funciones anónimas.
- `while`.
- `do while`.
- `switch`.
- Clases.
- Objetos.
- Módulos.
- Herencia.
- Interfaces.
- Genéricos definidos por el usuario.
- Inferencia de tipos.
- Manejo avanzado de excepciones.
- Programación asíncrona.
- Promesas.
- Tipos definidos por el usuario.

Las estructuras `stack<T>` y `queue<T>` representan una característica propia del lenguaje y no constituyen un sistema general de genéricos.

---

# 34. Decisiones pendientes

Las siguientes decisiones quedan deliberadamente abiertas para una fase posterior:

1. Nombre definitivo del lenguaje.
2. Gramática formal completa.
3. Reglas exactas de conversión entre `int` y `float`.
4. Representación interna de arrays.
5. Comportamiento exacto ante `pop()` o `dequeue()` de una estructura vacía.
6. Escape sequences permitidas en strings.
7. Representación exacta del código intermedio.
8. Estrategias concretas de optimización.
9. Arquitectura del runtime generado.
10. Formato del ejecutable/CLI del compilador.

Estas decisiones deberán documentarse antes de implementar las fases correspondientes.

---

# 35. Roadmap de implementación

El desarrollo del compilador seguirá aproximadamente este orden:

### Fase 1 — Especificación

- Definir sintaxis.
- Definir tokens.
- Definir tipos.
- Definir reglas semánticas.
- Definir gramática formal.

### Fase 2 — Analizador léxico

Implementar:

- Scanner.
- Tokens.
- Literales.
- Identificadores.
- Palabras reservadas.
- Operadores.
- Comentarios.
- Errores léxicos.

### Fase 3 — Analizador sintáctico

Implementar:

- Parser.
- AST.
- Expresiones.
- Declaraciones.
- Asignaciones.
- `if`.
- `for`.
- Arrays.
- Stacks.
- Queues.
- Entrada/salida.

### Fase 4 — Analizador semántico

Implementar:

- Tabla de símbolos.
- Scopes.
- Verificación de tipos.
- Variables no declaradas.
- Constantes.
- Compatibilidad de operaciones.
- Validación de estructuras tipadas.

### Fase 5 — Código intermedio

Implementar:

- IR.
- Temporales.
- Labels.
- Saltos.
- Operaciones.
- Representación de estructuras.

### Fase 6 — Optimización

Implementar inicialmente:

- Constant folding.
- Constant propagation.
- Simplificación.
- Eliminación de código inalcanzable.

### Fase 7 — Generación de JavaScript

Implementar:

- Generador de código.
- Variables.
- Expresiones.
- Control de flujo.
- Arrays.
- Stacks.
- Queues.
- Entrada/salida.

### Fase 8 — CLI y pruebas

El compilador deberá poder utilizarse mediante una interfaz de línea de comandos.

Ejemplo conceptual:

```text
compiler program.lang
```

Generando:

```text
program.js
```

También deberá existir un conjunto de programas de prueba que cubra casos válidos y errores de cada fase.

---

# 36. Ejemplo de programa representativo

Como prueba de integración, el lenguaje deberá ser capaz de expresar un programa como:

```text
program Main {

    const int LIMIT = 5;

    int[] values = [10, 20, 30, 40, 50];

    stack<int> stackValues;
    queue<int> queueValues;

    for (int i = 0; i < LIMIT; i = i + 1) {

        int value = values[i];

        if (value >= 30) {
            stackValues.push(value);
        } else {
            queueValues.enqueue(value);
        }
    }

    print("Stack size:");
    print(stackValues.size());

    print("Queue size:");
    print(queueValues.size());

    if (!stackValues.isEmpty()) {
        print("Stack top:");
        print(stackValues.peek());
    }

    if (!queueValues.isEmpty()) {
        print("Queue front:");
        print(queueValues.front());
    }
}
```

Este programa reúne:

- Constantes.
- Variables.
- `int`.
- `string`.
- Arrays.
- Stack.
- Queue.
- `for`.
- `if`.
- `else`.
- Operadores.
- Ámbitos.
- Expresiones.
- Salida.
- Métodos de estructuras tipadas.

Por lo tanto, servirá posteriormente como una de las pruebas principales del compilador.

---

## 37. Estado de la especificación

Esta especificación corresponde a la **versión 0.1** del lenguaje.

No debe considerarse todavía una especificación definitiva. Las secciones pendientes deberán cerrarse antes de iniciar la implementación completa del compilador.

El siguiente paso técnico recomendado es definir la **especificación léxica formal**, incluyendo el conjunto completo de tokens, expresiones regulares, literales, identificadores, operadores, delimitadores y palabras reservadas. Después podremos construir la gramática formal para el parser.
