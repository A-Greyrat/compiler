import {SyntaxTree, SyntaxTreeNode} from "../parser";


export class Symbol {
    constructor(public identifier: string, public type: string, public value?: string | number | boolean | any[]) {
    }
}

export class SymbolTable {
    private symbols: Symbol[] = [];

    public addSymbol(identifier: string, type: string, value?: string | any[]) {
        if (type.includes('[')) {
            value = [];
        }

        this.symbols.push(new Symbol(identifier, type, value));
    }

    public getSymbols() {
        return this.symbols;
    }

    public getSymbol(identifier: string) {
        return this.symbols.find((symbol) => symbol.identifier === identifier);
    }
}

export const buildSymbolTable = (syntaxTree: SyntaxTree): SymbolTable => {
    const symbolTable = new SymbolTable();
    let currentType = "";
    let currentIdentifier = "";
    const traverse = (node: SyntaxTreeNode) => {
        const getType = (node: SyntaxTreeNode) => {
            if (node.children[0].type === 'array') {
                return node.children[0].children[0].children[0].value + '[' + node.children[0].children[2].value + ']';
            } else {
                return node.children[0].value;
            }
        }

        if (node.type === 'decl') {
            currentType = getType(node.children[0]);
            currentIdentifier = node.children[1].value;
            symbolTable.addSymbol(currentIdentifier, currentType, undefined);
        }

        for (let i = 0; i < node.children.length; i++) {
            traverse(node.children[i]);
        }
    };

    traverse(syntaxTree.root);
    return symbolTable;
}
