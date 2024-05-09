import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser, SyntaxTreeNode} from "./parser";
import * as fs from 'fs';
import {Translator} from "./translator";
import {Quadruple} from "./parser/LR1Parser";

import {buildSymbolTable} from "./symbol/Symbol";
import {VirtualMachine} from "./vm/VirtualMachine";

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
console.table(tokens);

// 项目集规范族和分析表
const states = generateLR1States(grammar);
// console.log(states.map(x=>x.map(y=>({...y, rule: `${grammar[y.ruleIndex].lhs} -> ${grammar[y.ruleIndex].rhs.join(' ')}`}))));
// console.log(states.reduce((acc, x) => acc + x.length, 0) + " states generated");

let tables = JSON.parse(fs.readFileSync('tables.json', 'utf8').toString());
if (tables === null) {
    tables = generateActionGotoTables(states, grammar);
    fs.writeFileSync('tables.json', JSON.stringify(tables, null, 2));
}

const parser = new LR1Parser(grammar, tables.actionTable, tables.gotoTable);
parser.parse(tokens);

parser.log();
const syntaxTree = parser.getSyntaxTree();

// 生成符号表
const symbolTable = buildSymbolTable(syntaxTree);
console.table(Array.from(symbolTable.getSymbols()));

const translator = new Translator(syntaxTree);
translator.translate();

const toString = (q: Quadruple[] | undefined) => {
    if (q === undefined) return '';
    return q.map((x) => {
        return `[op:${x.op} arg1:${x.arg1} arg2:${x.arg2} result:${x.result}]`;
    }).join(' ');
}

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


for (let i = 0; i < syntaxTree.root.code.length; i++) {
    console.log(`op: ${syntaxTree.root.code[i].op} arg1: ${syntaxTree.root.code[i].arg1} arg2: ${syntaxTree.root.code[i].arg2} result: ${syntaxTree.root.code[i].result}`);
}


const vm = new VirtualMachine(syntaxTree.root.code, symbolTable);

vm.run();

console.table(Array.from(symbolTable.getSymbols()));
