import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser, SyntaxTreeNode} from "./parser";
import * as fs from 'fs';
import {Translator} from "./translator";

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
const symbolTable = lexer.getSymbolTable();

// 词法分析输出
console.table(Array.from(symbolTable));
console.table(tokens);

// 项目集规范族和分析表
const states = generateLR1States(grammar);
console.log(states.map(x=>x.map(y=>({...y, rule: `${grammar[y.ruleIndex].lhs} -> ${grammar[y.ruleIndex].rhs.join(' ')}`}))));
console.log(states.reduce((acc, x) => acc + x.length, 0) + " states generated");
const tables = generateActionGotoTables(states, grammar);
fs.writeFileSync('tables.json', JSON.stringify(tables, null, 2));

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
