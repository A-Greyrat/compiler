import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser, SyntaxTreeNode} from "./parser";
import * as fs from 'fs';
import {Translator} from "./translator";

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
const symbolTable = lexer.getSymbolTable();

console.table(Array.from(symbolTable));

const tables = generateActionGotoTables(generateLR1States(grammar), grammar);
const parser = new LR1Parser(grammar, tables.actionTable, tables.gotoTable);
parser.parse(tokens);

parser.log();
const syntaxTree = parser.getSyntaxTree();

const logTree = (node: SyntaxTreeNode, depth = 0, left = "", right = "") => {
    if (node.type === node.value) {
        console.log(left + right + '[' + node.type + '] ');
    } else {
        console.log(left + right + '[' + node.type + ': ' + node.value + '] ');
    }

    left += (right === "└── " || right === "") ? "    " : "│   ";

    for (let i = 0; i < node.children.length; i++) {
        if (i === node.children.length - 1) {
            logTree(node.children[i], depth + 1, left, "└── ");
        } else {
            logTree(node.children[i], depth + 1, left, "├── ");
        }
    }
}
logTree(syntaxTree.root);
