import { Lexer } from "./lexer";

const validCode = `
int A=5;
int B=10;

if(A=B){
  print("Iguales");
}
`

const invalidCode = `
while(A=B@){
  print("Iguales");
}
`

function runLexerTest(testName: string, source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    console.table(
      tokens.map((token, index) => ({
        "#": index + 1,
        Type: token.type,
        Value: token.value,
        Literal: token.literal ?? "",
        Line: token.line,
        Column: token.column
      })
    )
  );
}

runLexerTest("Caso Valido", validCode);
runLexerTest("Caso con Errores léxicos", invalidCode);