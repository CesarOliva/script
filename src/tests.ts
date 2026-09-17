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
program TestValido {
  int A = 5;
  int B = 8;
  
  if (A == B) {
    print("Iguales");
  } else {
    print("Diferentes");
  }
}
`;

// Ejemplo 2: Error Léxico
const lexicalErrorCode = `
program TestErrorLexico {
  bool result = true;
}
`;

// Ejemplo 3: Error Sintáctico (while no pertenece a la gramática EBNF o falta ';' )
const syntaxErrorCode = `
program TestErrorSintactico {
  int A = 5
  while (A == 5) {
    print("Error");
  }
}
`;

// Ejecución
testCompiler("Caso 1: Programa Válido", validCode);
testCompiler("Caso 2: Error Léxico (@)", lexicalErrorCode);
testCompiler("Caso 3: Error Sintáctico ('while' / falta ';')", syntaxErrorCode);