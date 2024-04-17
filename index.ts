import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser} from "./parser";
import * as fs from 'fs';

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
const tables = generateActionGotoTables(generateLR1States(grammar), grammar);

const parser = new LR1Parser(grammar, tables.actionTable, tables.gotoTable);
parser.parse(tokens);

const ast = parser.getAST();

// 生成AST后，可以对AST进行遍历，生成中间代码


