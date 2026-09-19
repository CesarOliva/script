import * as AST from "./ast";
import { SymbolTable } from "./symbolTable";

export interface SemanticError {
    message: string;
    line?: number;
    column?: number;
}

export class SemanticAnalyzer {
    private symbolTable = new SymbolTable();
    public errors: SemanticError[] = [];

    analyze(ast: AST.ProgramNode): boolean {
        this.visitProgram(ast);
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
        if(valueType && valueType!== node.varType) {
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

        if(!inserted) {
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
        for(const stmt of node.thenBranch) {
            this.visitStatement(stmt);
        }
        this.symbolTable.exitScope();
    }

    private visitForStatement(node: AST.ForStatementNode): void {
        this.symbolTable.enterScope();

        if (node.init) {
            this.visitStatement(node.init);
        }

        if (node.condition) {
            const condType = this.getExpressionType(node.condition);
            if(condType && condType !== 'bool') {
                this.errors.push({
                    message: `La condición del 'for' debe ser de tipo 'bool', se obtuvo '${condType}'`
                })
            }
        }

        if (node.update) {
            if('type' in node.update && typeof node.update.type === 'string' && node.update.type.endsWith('Statement')) {
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

        if(!symbol) {
            this.errors.push({
                message: `La variable '${node.target}' utilizada en 'read()' no ha sido declarada`
            })
            return;
        }

        if(!symbol.mutable) {
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

        if(!symbol.mutable) {
            this.errors.push({
                message: `No se puede modificar la constante '${node.target}'`
            })
        }

        const exprType = this.getExpressionType(node.value);
        if (exprType && exprType !== symbol.type) {
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

            default:
                return undefined;
        }
    }
}