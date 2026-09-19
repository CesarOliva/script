import * as AST from "./ast";
import { SymbolTable } from "./symbolTable";

export interface SemanticError {
    message: string;
    line?: number;
    column?: number;
}

const stackMethods = ['push', 'pop', 'peek', 'isEmpty', 'size', 'clear'];
const queueMethods = ['enqueue', 'dequeue', 'front', 'isEmpty', 'size', 'clear'];

export class SemanticAnalyzer {
    private symbolTable = new SymbolTable();
    public errors: SemanticError[] = [];

    analyze(ast: AST.ProgramNode | AST.StatementNode[]): boolean {
        this.errors = [];

        if ('body' in ast && Array.isArray(ast.body)) {
            this.visitProgram(ast as AST.ProgramNode);
        } else if (Array.isArray(ast)){
            for (const stmt of ast) {
                this.visitStatement(stmt);
            }
        }

        return this.errors.length === 0;
    }

    private visitProgram(node: AST.ProgramNode): void {
        for (const stmt of node.body) {
            this.visitStatement(stmt);
        }
    }

    private visitStatement(stmt: AST.StatementNode): void {
        switch (stmt.type) {
            case 'VariableDeclaration':
                this.visitVariableDeclaration(stmt);
                break;
            case 'ConstantDeclaration':
                this.visitConstantDeclaration(stmt);
                break;
            case 'IfStatement':
                this.visitIfStatement(stmt);
                break;
            case 'ForStatement':
                this.visitForStatement(stmt);
                break;
            case 'WhileStatement':
                this.visitWhileStatement(stmt);
                break;
            case 'PrintStatement':
                this.visitPrintStatement(stmt);
                break;
            case 'ReadStatement':
                this.visitReadStatement(stmt);
                break;
            case 'Assignment':
                this.visitAssignment(stmt);
                break;
            case 'ExpressionStatement':
                this.visitExpressionStatement(stmt);
                break;
        }
    }

    private visitVariableDeclaration(node: AST.VariableDeclarationNode): void {
        let initType: string | undefined;

        if (node.initializer) {
            initType = this.getExpressionType(node.initializer);
            if (initType && initType !== node.varType) {
                this.errors.push({
                    message: `Incompatibilidad de tipos: Se esperaba '${node.varType}, se obtuvo '${initType}'`
                })
            }
        }

        const inserted = this.symbolTable.insert({
            name: node.name,
            type: node.varType,
            kind: 'variable',
            scope: this.symbolTable.getCurrentScopeLevel(),
            mutable: true
        })

        if (!inserted) {
            this.errors.push({
                message: `La variable ${node.name}' ya ha sido declarada en el ámbito actual`
            })
        }
    }

    private visitConstantDeclaration(node: AST.ConstantDeclarationNode): void {
        const valueType = this.getExpressionType(node.value);
        if (valueType && valueType!== node.varType) {
            this.errors.push({
                message: `Incompatibilidad de tipos en constante '${node.name}': Se esperaba '${node.varType}', se obtuvo '${valueType}'`
            })
        }

        const inserted = this.symbolTable.insert({
            name: node.name,
            type: node.varType,
            kind: 'constant',
            scope: this.symbolTable.getCurrentScopeLevel(),
            mutable: false
        })

        if (!inserted) {
            this.errors.push({
                message: `La constante '${node.name}' ya ha sido declarada en este ámbito`
            })
        }
    }

    private visitIfStatement(node: AST.IfStatementNode): void {
        const condType = this.getExpressionType(node.condition);
        if (condType && condType !== 'bool') {
            this.errors.push({
                message: `La condición del 'if' debe ser de tipo 'bool', se recibió '${condType}'`
            })
        }

        this.symbolTable.enterScope();
        for (const stmt of node.thenBranch) {
            this.visitStatement(stmt);
        }
        this.symbolTable.exitScope();

        if (node.elseBranch) {
            if (Array.isArray(node.elseBranch)) {
                this.symbolTable.enterScope();
                for (const stmt of node.thenBranch) {
                    this.visitStatement(stmt);
                }
                this.symbolTable.exitScope();
            } else {
                this.visitIfStatement(node.elseBranch as AST.IfStatementNode);
            }
        }
    }

    private visitForStatement(node: AST.ForStatementNode): void {
        this.symbolTable.enterScope();

        if (node.init) {
            this.visitStatement(node.init);
        }

        if (node.condition) {
            const condType = this.getExpressionType(node.condition);
            if (condType && condType !== 'bool') {
                this.errors.push({
                    message: `La condición del 'for' debe ser de tipo 'bool', se obtuvo '${condType}'`
                })
            }
        }

        if (node.update) {
            if ('type' in node.update && typeof node.update.type === 'string' && node.update.type.endsWith('Statement')) {
                this.visitStatement(node.update as AST.StatementNode);
            } else {
                this.getExpressionType(node.update as AST.ExpressionNode);
            }
        }

        for (const stmt of node.body) {
            this.visitStatement(stmt);
        }

        this.symbolTable.exitScope();
    }

    private visitWhileStatement(node: AST.WhileStatementNode): void {
        const condType = this.getExpressionType(node.condition);
        if (condType && condType !== 'bool') {
            this.errors.push({
                message: `La condición del 'while' debe ser de tipo 'bool', se obtuvo '${condType}'`
            })
        }

        this.symbolTable.enterScope();
        for (const stmt of node.body) {
            this.visitStatement(stmt);
        }

        this.symbolTable.exitScope();
    }

    private visitPrintStatement(node: AST.PrintStatementNode): void {
        this.getExpressionType(node.expression);
    }

    private visitReadStatement(node: AST.ReadStatementNode): void {
        const symbol = this.symbolTable.lookup(node.target);

        if (!symbol) {
            this.errors.push({
                message: `La variable '${node.target}' utilizada en 'read()' no ha sido declarada`
            })
            return;
        }

        if (!symbol.mutable) {
            this.errors.push({
                message: `No se puede leer un valor mediante 'read()' hacia la constante '${node.target}'`
            })
        }
    }

    private visitAssignment(node: AST.AssignmentNode): void {
        const symbol = this.symbolTable.lookup(node.target);

        if (!symbol) {
            this.errors.push({
                message: `La variable '${node.target}' no ha sido declarada`
            });
            return;
        }

        if (!symbol.mutable) {
            this.errors.push({
                message: `No se puede modificar la constante '${node.target}'`
            })
        }

        if (node.index) {
            const indexType = this.getExpressionType(node.index);
            if (indexType && indexType !== 'int') {
                this.errors.push({
                    message: `El índice de un arreglo debe ser de tipo 'int', se recibió '${indexType}'`
                });
            }
        }

        const exprType = this.getExpressionType(node.value);

        const expectedType = node.index && symbol.type.endsWith('[]')
            ? symbol.type.replace('[]', '')
            : symbol.type;

        if (exprType && exprType !== expectedType) {
            this.errors.push({
                message: `No se puede asignar un valor de tipo '${exprType}' a '${node.target}' (${symbol.type})`
            })
        }
    }

    private visitExpressionStatement(stmt: AST.ExpressionStatementNode): void {
        this.getExpressionType(stmt.expression);
    }

    private getExpressionType(expr: AST.ExpressionNode): string | undefined {
        switch (expr.type) {
            case 'Literal':
                if (typeof expr.value === 'number') {
                    return Number.isInteger(expr.value) ? 'int' : 'float';
                }
                if (typeof expr.value === 'boolean') return 'bool';
                if (typeof expr.value === 'string') return 'string';
                return undefined;

            case 'Identifier': {
                const symbol = this.symbolTable.lookup(expr.name);
                if (!symbol) {
                    this.errors.push({
                        message: `La variable '${expr.name}' no ha sido declarada`
                    })
                    return undefined;
                }
                return symbol.type
            }

            case 'BinaryExpression': {
                const leftType = this.getExpressionType(expr.left);
                const rightType = this.getExpressionType(expr.right);

                if (['==', '!=', '<', '<=','>', '>='].includes(expr.operator)) {
                    if (leftType !== rightType) {
                        this.errors.push({
                            message: `Operación relacional incompatible entre '${leftType}' y '${rightType}'`
                        })
                    }
                    return 'bool';
                }

                if (['+', '-', '*', '/', '%'].includes(expr.operator)) {
                    if (leftType !== rightType) {
                        this.errors.push({
                            message: `Operación aritmética incompatible entre '${leftType}' y '${rightType}'`        
                        })
                    }
                    return leftType;
                }

                return undefined
            }

            case 'MethodCall':
                return this.visitMethodCall(expr);

            case 'IndexAccess': {
                const arrayType = this.getExpressionType(expr.array);
                const indexType = this.getExpressionType(expr.index);

                if (indexType && indexType !== 'int') {
                    this.errors.push({
                        message: `El índice de acceso al arreglo debe ser de tipo 'int', se recibió '${indexType}'`
                    })
                }

                if (arrayType && arrayType.endsWith('[]')) {
                    return arrayType.replace('[]', '');
                }

                this.errors.push({
                    message: `Acceso por índice no válido sobre el tipo '${arrayType}'`
                })
                return undefined;
            }

            case "ArrayLiteral": {
                if (expr.elements.length === 0) return 'int[]';

                const firstType = this.getExpressionType(expr.elements[0]);
                for(let i = 1; i < expr.elements.length; i++) {
                    const elemType = this.getExpressionType(expr.elements[i]);
                    if (elemType !== firstType) {
                        this.errors.push({
                            message: `Los elementos del arreglo deben ser homogéneos. Se encontró '${elemType}' y '${firstType}'`
                        })
                    }
                }
                
                return `${firstType}[]`;
            }

            default:
                return undefined;
        }
    }

    private visitMethodCall(node: AST.MethodCallNode): string | undefined {
        const symbol = this.symbolTable.lookup(node.object);

        if (!symbol) {
            this.errors.push({
                message: `El objeto '${node.object}' no ha sido declarado`
            })
            return undefined;
        }

        if (symbol.type.startsWith('stack<')) {
            if (!stackMethods.includes(node.method)) {
                this.errors.push({
                    message: `El método '${node.method}()' no existe para la estructura 'stack'. Métodos válidos: ${stackMethods.join(', ')}`
                })
                return undefined;
            }
            const innerType = symbol.type.match(/<(.+)>/)?.[1];

            if (node.method == 'push') {
                if (node.args.length !== 1) {
                    this.errors.push({
                        message: `El método 'push()' requiere exactamente 1 argumento.`
                    })
                } else {
                    const argType = this.getExpressionType(node.args[0]);
                    if (argType && argType !== innerType) {
                        this.errors.push({
                            message: `Elemento incorrecto en stack: 'push()' esperaba '${innerType}', recibió '${argType}'`
                        })
                    }
                }
                return 'void';
            }

            if(node.method === 'pop' || node.method === 'peek') return innerType;

            if(node.method === 'isEmpty') return 'bool';

            if(node.method === 'size') return 'int';

            if(node.method === 'clear') return 'void';
        }

        if (symbol.type.startsWith('queue<')) {
            if (!queueMethods.includes(node.method)) {
                this.errors.push({
                    message: `El método '${node.method}()' no existe para la estructura 'queue'. Métodos válidos: ${queueMethods.join(', ')}`
                })
            }

            const innerType = symbol.type.match(/<(.+)>/)?.[1];

            if(node.method === 'enqueue') {
                if(node.args.length !== 1) {
                    this.errors.push({ 
                        message: `El método 'enqueue()' requiere exactamente 1 argumento`
                    });
                } else {
                    const argType = this.getExpressionType(node.args[0]);
                    if(argType && argType !== innerType) {
                        this.errors.push({
                            message: `Elemento incorrecto en queue: 'enqueue()' esperaba '${innerType}', pero recibió '${argType}'`
                        })
                    }
                }
                return 'void';
            }

            if (node.method === 'dequeue' || node.method === 'front') return innerType;

            if (node.method === 'isEmpty') return 'bool';

            if(node.method === 'size') return 'int';

            if(node.method === 'clear') return 'void'
        }

        this.errors.push({
            message: `La variable '${node.object}' (${symbol.type}) no soporta la invocación de métodos`
        })

        return undefined;
    }

    public getSymbolTable(): SymbolTable {
        return this.symbolTable;
    }
}