export enum TokenType{
    // Palabras reservadas
    int = "int",
    if = "if",
    print = "print",

    // Identificadores y literales
    identifier = "identifier",
    integerLiteral = "integerLiteral",
    stringLiteral = "stringLiteral",

    // Operadores
    assign = "assign",
    equal_equal = "equal_equal",

    // Delimitadores
    semicolon = "semicolon",
    leftParen = "leftParen",
    rightParen = "rightParen",
    leftBrace = "leftBrace",
    rightBrace = "rightBrace",

    // Especiales
    EOF = "EOF",
    ERROR = "ERROR"
}

export interface Token {
    type: TokenType;
    value: string;
    literal?: any;
    line: number;
    column: number;
}

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private current = 0;
    private line = 1;
    private column = 1;

    private keywords: Map<string, TokenType> = new Map([
        ["int", TokenType.int],
        ["if", TokenType.if],
        ["print", TokenType.print]
    ]);

    constructor(source: string) {
        this.source = source;
    }

    public scanTokens(): Token[] {
        while(!this.isAtEnd()){
            const startColumn = this.column;
            const char = this.advance();

            switch(char) {
                // Espacios y saltos de linea
                case ' ':
                case '\r':
                case '\t':
                    break;
                case '\n':
                    this.line++;
                    this.column = 1;
                    break;

                // Delimitadores
                case ";": this.addToken(TokenType.semicolon, ";", startColumn); break
                case "(": this.addToken(TokenType.leftParen, "(", startColumn); break
                case ")": this.addToken(TokenType.rightParen, ")", startColumn); break
                case "{": this.addToken(TokenType.leftBrace, "{", startColumn); break
                case "}": this.addToken(TokenType.rightBrace, "}", startColumn); break

                // Operadores
                case "=":
                    if(this.match("=")){
                        this.addToken(TokenType.equal_equal, "==", startColumn);
                    } else{
                        this.addToken(TokenType.assign, "=", startColumn);
                    }
                    break

                // Cadenas
                case '"':
                    this.stringLiteral(startColumn);
                    break;

                default:
                    if (this.isDigit(char)) {
                        this.numberLiteral(char, startColumn);
                    } else if(this.isAlpha(char)){
                        this.identifierOrKeyword(char, startColumn)
                    } else{
                        this.addToken(TokenType.ERROR, char, startColumn, `Carácter no reconocido '${char}'`)
                    }
            }
        }
        return this.tokens;
    }
    
    private advance(): string {
        const char = this.source.charAt(this.current++);
        this.column++;
        return char;
    }

    private match(expected: string): boolean {
        if(this.isAtEnd()) return false;
        if(this.source.charAt(this.current) !== expected) return false;
        this.current++;
        this.column++;
        return true
    }

    private peek(): string {
        if(this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private isAlpha(char: string): boolean {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }

    private isAlphaNumeric(char: string): boolean {
        return this.isAlpha(char) || this.isDigit(char);
    }

    private stringLiteral(startColumn: number): void {
        let strValue="";
        while(this.peek() !== '"' && !this.isAtEnd()){
            if(this.peek() === '\n'){
                this.line++;
                this.column = 1;
            }

            strValue += this.advance();
        }

        if(this.isAtEnd()){
            this.addToken(TokenType.ERROR, `"${strValue}"`, startColumn, "Cadena (string) sin cerrar");
            return;
        }

        this.advance(); // Cierra la cadena
        this.addToken(TokenType.stringLiteral, `"${strValue}"`, startColumn, strValue);
    }

    private numberLiteral(firstChar: string, startColumn: number): void {
        let numStr = firstChar;
        while(this.isDigit(this.peek())){
            numStr += this.advance();
        }
        this.addToken(TokenType.integerLiteral, numStr, startColumn, parseInt(numStr, 10));
    }

    private identifierOrKeyword(firstChar: string, startColumn: number): void {
        let text = firstChar;
        while(this.isAlphaNumeric(this.peek())){
            text += this.advance();
        }

        const type = this.keywords.get(text) || TokenType.identifier
        this.addToken(type, text, startColumn)
    }

    private addToken(type: TokenType, value: string, startColumn: number, literal?: any): void {
        this.tokens.push({
            type,
            value,
            literal,
            line: this.line,
            column: startColumn
        })
    }
}