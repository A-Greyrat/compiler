import {Lexer} from "./tokenizer";
import {generateActionGotoTables, generateLR1States, grammar, LR1Parser} from "./parser";
import * as fs from 'fs';
import {ASTNode} from "./parser/LR1Parser";

const sourceCode = fs.readFileSync('source.mk', 'utf8');

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();

const states = generateLR1States(grammar);
// states.forEach((state, i) => {
//     console.log(`State ${i}:`);
//     state.forEach(item => {
//         item.toString = () => {
//             return `${grammar[item.ruleIndex].lhs} -> ${grammar[item.ruleIndex].rhs.slice(0, item.dot).join(' ')} . ${grammar[item.ruleIndex].rhs.slice(item.dot).join(' ')} , ${item.lookahead}`;
//         };
//         console.log(item.toString());
//     });
//     console.log();
// });

const tables = generateActionGotoTables(states, grammar);

const parser = new LR1Parser(grammar, tables.actionTable, tables.gotoTable);
parser.parse(tokens);
const ast = parser.getAST();
// 生成AST后，可以对AST进行遍历，生成中间代码

