import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser, SyntaxTreeNode} from "./parser";
import * as fs from 'fs';
import {Translator} from "./translator";

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
const tables = generateActionGotoTables(generateLR1States(grammar), grammar);

const parser = new LR1Parser(grammar, tables.actionTable, tables.gotoTable);
parser.parse(tokens);

const ast = parser.getSyntaxTree();

const logAST = (node: SyntaxTreeNode, depth = 0, left = "", right = "└── ") => {
    if (node.type === node.value) {
        console.log(left + right + '[' + node.type + '] ');
    } else {
        console.log(left + right + '[' + node.type + ': ' + node.value + '] ');
    }

    left += right === "└── " ? "    " : "│   ";

    for (let i = 0; i < node.children.length; i++) {
        if (i === node.children.length - 1) {
            logAST(node.children[i], depth + 1, left, "└── ");
        } else {
            logAST(node.children[i], depth + 1, left, "├── ");
        }
    }
}

logAST(ast.root);
