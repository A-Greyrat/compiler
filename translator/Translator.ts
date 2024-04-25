import {SyntaxTree, SyntaxTreeNode} from "../parser";

export class ASTNode {
    public children: ASTNode[];
    public parent: ASTNode | undefined;
    public value: string;
    public type: string;
    public scope: string | undefined;
    public code: string | undefined;

    constructor(value: string, type: string) {
        this.value = value;
        this.type = type;
        this.children = [];
    }

    public addChild(node: ASTNode): void {
        this.children.push(node);
        node.parent = this;
    }

    public removeChild(node: ASTNode): void {
        this.children = this.children.filter(child => child !== node);
    }

    public replaceChild(node: ASTNode, newNode: ASTNode): void {
        this.children = this.children.map(child => child === node ? newNode : child);
    }

    public toString(): string {
        return `${this.value} (${this.type})`;
    }

    public print(depth: number = 0): void {
        console.log(`${"  ".repeat(depth)}${this.toString()}`);
        this.children.forEach(child => child.print(depth + 1));
    }

}

export class AST {
    public root: ASTNode;

    constructor(root: ASTNode) {
        this.root = root;
    }

    public print(): void {
        this.root.print();
    }
}



export class Translator {
    // 1． 输出语法分析过程；
    // 2． 输出中间代码，要求三地址代码；
    // 在自底向上语法分析基础上设计语义规则（语法制导翻译），将源程序翻译为四元式输出，若有错误将错误信息输出。

    private syntaxTree: SyntaxTree;
    private ast: AST | undefined;

    constructor(syntaxTree: SyntaxTree) {
        this.syntaxTree = syntaxTree;
    }

    public generateAST(): void {
        this.ast = new AST(this.generateASTNode(this.syntaxTree.root));
    }

    public generateIntermediateCode(): void {
    }

    private generateASTNode(root: SyntaxTreeNode) {
        const node = new ASTNode(root.value, root.type);
        root.children.forEach(child => node.addChild(this.generateASTNode(child)));
        return node;
    }
}
