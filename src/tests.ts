import { Lexer } from "./lexer"; // Ajusta ruta
import { Parser } from "./parser"; // Ajusta ruta

function testCompiler(testName: string, source: string) {
  console.log(`\n==================================================`);
  console.log(` RUNNING TEST: ${testName}`);
  console.log(`==================================================`);

  try {
    // 1. Fase Léxica
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    const lexicalErrors = tokens.filter((t) => t.type === ("ERROR" as any));
    if (lexicalErrors.length > 0) {
      console.error("❌ ERRORES LÉXICOS DETECTADOS:");
      console.table(lexicalErrors);
      return;
    }

    // 2. Fase Sintáctica
    const parser = new Parser(tokens);
    const ast = parser.parse();

    console.log("✅ ÁRBOLES DE SINTAXIS ABSTRACTA (AST) GENERADO EXITOSAMENTE:");
    console.log(JSON.stringify(ast, null, 2));
  } catch (error: any) {
    console.error("❌ " + error.message);
  }
}

// Ejemplo 1: Caso Totalmente Válido
const validCode = ` 
program ArrayDemo {
  int[] numbers = [10, 20, 30];
  
  // Acceso a un valor
  int first = numbers[0];
  
  // Modificación mediante asignación por índice
  numbers[1] = 50;

  // Lectura con entrada/salida
  print(numbers[1]);
}
`;

// Ejemplo 2: Error Léxico
const lexicalErrorCode = `
program TestErrorLexico {
  int A = 5 @;
}
`;

const syntaxErrorCode = `
program StackTest {
  stack<int> numbers;
  numbers.push(10);
  
  while (numbers.size() > 0) {
    print(numbers.pop());
  }
}
`;

// Ejecución
testCompiler("Caso 1: Programa Válido", validCode);
testCompiler("Caso 2: Error Léxico (@)", lexicalErrorCode);
testCompiler("Caso 3: Programa Válido. Actualizado con while y tipos de datos", syntaxErrorCode);