import {SyntaxTree, SyntaxTreeNode} from "../parser";

//
// 语义规则
// program → block
// block→{ decls  stmts}
// decls → decls  decl  | ε
// decl → type  id;
// type → type[num] | int | double | bool
// stmts → stmts  stmt | ε
// stmt → loc=bool;
// | if(bool)stmt
// | if(bool)stmt else stmt
// | while(bool)stmt
// | do stmt while(bool);
// | break;
// | block
// Loc → loc[num]  | id
// bool →bool  ||  join   |  join
// join → join &&  equality  | equality
// equality → equality==rel  | equality ！= rel  | rel
// rel → expr<expr |expr<=expr|expr>=expr|expr>expr|expr
// expr → expr+term |expr-term |term
// term → term*unary|term/unary|unary
// unary→！unary | -unary | factor
// factor→ (expr) | loc | num | real | true |false


let tempIndex = 0;
let labelIndex = 0;
let loopStack: number[] = [];

// 获取直接数或者标识符
const getIdentifierOrImmediate = (node: SyntaxTreeNode) => {
    node.code.push({
        op: 'get',
        arg1: null,
        arg2: null,
        result: node.type === 'id' ? node.value : 'C ' + node.value
    });
};

// 数学或者逻辑运算
const mathOrLogic = (node: SyntaxTreeNode) => {
    if (node.children.length === 1) {
        node.code = node.children[0].code;
    } else {
        node.code = [...node.children[0].code, ...node.children[2].code].filter(x => x.op !== 'get');
        if (node.children[0].code.at(-1) === undefined || node.children[2].code.at(-1) === undefined) {
            console.log(node.children[0]);
        }


        node.code.push({
            op: node.children[1].value,
            arg1: node.children[0].code.at(-1)!.result,
            arg2: node.children[2].code.at(-1)!.result,
            result: 'T ' + tempIndex++
        });
    }
};


const translateTable: { [key: string]: (node: SyntaxTreeNode) => void } = {
    "id": getIdentifierOrImmediate,
    "num": getIdentifierOrImmediate,
    "real": getIdentifierOrImmediate,
    "true": getIdentifierOrImmediate,
    "false": getIdentifierOrImmediate,
    "factor": (node: SyntaxTreeNode) => {
        if (node.children.length === 1) {
            node.code = node.children[0].code;
        } else {
            node.code = node.children[1].code;
        }
    },
    "unary": (node: SyntaxTreeNode) => {
        if (node.children.length === 1) {
            node.code = node.children[0].code;
        } else {
            node.code = node.children[1].code.filter(x => x.op !== 'get');
            node.code.push({
                op: node.children[0].value,
                arg1: node.children[1].code.at(-1)!.result,
                arg2: null,
                result: 'T ' + tempIndex++
            });
        }
    },
    "term": mathOrLogic,
    "expr": mathOrLogic,
    "rel": mathOrLogic,
    "equality": mathOrLogic,
    "join": mathOrLogic,
    "bool": mathOrLogic,
    "loc": (node: SyntaxTreeNode) => {
        if (node.children.length === 1) {
            node.code = node.children[0].code;
        } else {
            // loc[num]
            node.code.push({
                op: '[]',
                arg1: node.children[0].code.at(-1)!.result,
                arg2: node.children[2].code.at(-1)!.result,
                result: 'T ' + tempIndex++
            });
        }
    },
    "stmt": (node: SyntaxTreeNode) => {
        if (node.children[0].type === 'loc') {
            // loc=bool;
            node.code = [...node.children[2].code, ...node.children[0].code].filter(x => x.op !== 'get');

            node.code.push({
                op: '=',
                arg1: node.children[2].code.at(-1)!.result,
                arg2: null,
                result: node.children[0].code.at(-1)!.result,
            });
        } else if (node.children[0].type === 'if') {
            // if(bool)stmt
            node.code = node.children[2].code;
            node.code.push({
                op: 'jfalse',
                arg1: node.children[2].code.at(-1)!.result,
                arg2: null,
                result: 'L' + labelIndex++,
            });

            node.code.push(...node.children[4].code);

            node.code.push({
                op: 'jmp',
                arg1: null,
                arg2: null,
                result: 'L' + labelIndex++,
            });

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + (labelIndex - 2)
            });

            if (node.children.length === 7) {
                // if(bool)stmt else stmt
                node.code.push(...node.children[6].code);
            }

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + (labelIndex - 1)
            });
        } else if (node.children[0].type === 'while') {
            // while(bool)stmt
            const label1 = loopStack.pop()!;
            const label2 = loopStack.pop()!;

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + label2
            });

            node.code.push(...node.children[2].code);

            node.code.push({
                op: 'jfalse',
                arg1: node.children[2].code.at(-1)!.result,
                arg2: null,
                result: 'L' + label1,
            });

            node.code.push(...node.children[4].code);

            node.code.push({
                op: 'jmp',
                arg1: null,
                arg2: null,
                result: 'L' + label2,
            });

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + label1
            });

        } else if (node.children[0].type === 'block') {
            // block
            node.code = node.children[1].code;
        } else if (node.children[0].type === 'do') {
            // do stmt while(bool);
            const label1 = loopStack.pop()!;
            const label2 = loopStack.pop()!;

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + label2
            });

            node.code.push(...node.children[1].code);

            node.code.push(...node.children[4].code);

            node.code.push({
                op: 'jtrue',
                arg1: node.children[4].code.at(-1)!.result,
                arg2: null,
                result: 'L' + label2,
            });

            node.code.push({
                op: 'label',
                arg1: null,
                arg2: null,
                result: 'L' + label1
            });
        } else if (node.children[0].type === 'break') {
            // break;
            node.code.push({
                op: 'jmp',
                arg1: null,
                arg2: null,
                result: 'L' + loopStack.at(-1),
            });

        } else {
            console.error('Unknown stmt type:', node.children[0].type);
        }
    },
    "stmts": (node: SyntaxTreeNode) => {
        for (let i = 0; i < node.children.length; i++) {
            node.code.push(...node.children[i].code);
        }
    },
    "decl": (node: SyntaxTreeNode) => {
    },

    "decls": (node: SyntaxTreeNode) => {
    },

    "block": (node: SyntaxTreeNode) => {
        for (let i = 0; i < node.children.length; i++) {
            node.code.push(...node.children[i].code);
        }
    },

    "program": (node: SyntaxTreeNode) => {
    },
    "if": (node: SyntaxTreeNode) => {

    },
    "=": (node: SyntaxTreeNode) => {

    },
};

export class Translator {
    private syntaxTree: SyntaxTree;

    constructor(syntaxTree: SyntaxTree) {
        this.syntaxTree = syntaxTree;
    }

    public translate() {
        this.translateNode(this.syntaxTree.root);
    }

    private translateNode(node: SyntaxTreeNode) {
        let code = "";

        if (node.children[0]?.type === 'while' || node.children[0]?.type === 'do') {
            loopStack.push(labelIndex++);
            loopStack.push(labelIndex++);
        }

        for (let i = 0; i < node.children.length; i++) {
            this.translateNode(node.children[i]);
        }

        if (translateTable[node.type]) {
            translateTable[node.type](node);
        }

        return code;
    }
}


