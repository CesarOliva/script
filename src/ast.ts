export type ASTNode = ProgramNode | StatementNode | ExpressionNode;

export interface ProgramNode {
    type: "Program";
    name: string;
    body: StatementNode[];
}

export type StatementNode =
    | VariableDeclarationNode
    | ConstantDeclarationNode
    | IfStatementNode 
    | ForStatementNode
    | WhileStatementNode
    | PrintStatementNode
    | ReadStatementNode
    | AssignmentNode
    | ExpressionStatementNode;

export interface VariableDeclarationNode {
    type: "VariableDeclaration";
    varType: string;
    name: string
    initializer?: ExpressionNode;
}

export interface ConstantDeclarationNode {
    type: "ConstantDeclaration";
    varType: string;
    name: string;
    value: ExpressionNode;
}

export interface IfStatementNode {
    type: "IfStatement";
    condition: ExpressionNode;
    thenBranch: StatementNode[];
    elseBranch?: StatementNode[] | IfStatementNode;
}

export interface ForStatementNode {
    type: "ForStatement";
    init?: StatementNode;
    condition?: ExpressionNode;
    update?: ExpressionNode | StatementNode;
    body: StatementNode[];
}

export interface WhileStatementNode {
    type: "WhileStatement";
    condition?: ExpressionNode;
    body: StatementNode[];
}

export interface PrintStatementNode {
    type: "PrintStatement";
    expression: ExpressionNode;
}

export interface ReadStatementNode {
    type: "ReadStatement";
    target: string;
}

export interface AssignmentNode {
    type: "Assignment";
    target: string;
    value: ExpressionNode;
}

export interface ExpressionStatementNode {
    type: "ExpressionStatement";
    expression: ExpressionNode;
}

export type ExpressionNode = 
    | BinaryExpressionNode 
    | UnaryExpressionNode
    | LiteralNode 
    | IdentifierNode;

export interface BinaryExpressionNode {
    type: "BinaryExpression";
    left: ExpressionNode;
    operator: string;
    right: ExpressionNode;
}

export interface UnaryExpressionNode {
    type: "UnaryExpression";
    operator: string;
    argument: ExpressionNode;
}

export interface LiteralNode {
    type: "Literal";
    value: any;
    raw: string;
}

export interface IdentifierNode {
    type: "Identifier";
    name: string;
}