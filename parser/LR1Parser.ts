import {grammar, isNonTerminal, isTerminal, Rule} from './Grammar';
import {Token} from "../tokenizer";

interface LR1Item {
    ruleIndex: number;
    dot: number;
    lookahead: string;
}


interface LR1StackItem {
    state: number;
    symbol: string;
    value?: string;
}

type ActionEntry = { type?: 'SHIFT' | 'REDUCE' | 'ACCEPT' | 'ERROR', nextState?: number, productionNumber?: number };
type ActionTable = { [key: number]: { [key: string]: ActionEntry } };
type GotoTable = { [key: number]: { [key: string]: number } };

const closure = (items: LR1Item[], grammar: Rule[]): LR1Item[] => {
    const closureItems = items.slice();
    let changed = true;

    while (changed) {
        changed = false;
        for (let i = 0; i < closureItems.length; i++) {
            const item = closureItems[i];
            const rule = grammar[item.ruleIndex];
            if (item.dot < rule.rhs.length && isNonTerminal(rule.rhs[item.dot])) {
                const nonTerminal = rule.rhs[item.dot];
                for (let j = 0; j < grammar.length; j++) {
                    if (grammar[j].lhs === nonTerminal) {
                        const newItem = {ruleIndex: j, dot: 0, lookahead: item.lookahead};
                        if (!closureItems.some((item) => item.ruleIndex === newItem.ruleIndex && item.dot === newItem.dot && item.lookahead === newItem.lookahead)) {
                            closureItems.push(newItem);
                            changed = true;
                        }
                    }
                }
            }
        }
    }

    return closureItems;
}

const goto = (items: LR1Item[], symbol: string, grammar: Rule[]): LR1Item[] => {
    const gotoItems = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rule = grammar[item.ruleIndex];
        if (item.dot < rule.rhs.length && rule.rhs[item.dot] === symbol) {
            gotoItems.push({ruleIndex: item.ruleIndex, dot: item.dot + 1, lookahead: item.lookahead});
        }
    }
    return closure(gotoItems, grammar);
}

const itemsAreEqual = (items1: LR1Item[], items2: LR1Item[]): boolean => {
    if (items1.length !== items2.length) {
        return false;
    }
    for (let i = 0; i < items1.length; i++) {
        if (items1[i].ruleIndex !== items2[i].ruleIndex || items1[i].dot !== items2[i].dot || items1[i].lookahead !== items2[i].lookahead) {
            return false;
        }
    }
    return true;
}

export const generateLR1States = (grammar: Rule[]): LR1Item[][] => {
    const states: LR1Item[][] = [];
    const startItem = {ruleIndex: 0, dot: 0, lookahead: '$'};
    const startState = closure([startItem], grammar);
    states.push(startState);

    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < states.length; i++) {
            const state = states[i];
            const symbols = new Set<string>();
            for (let j = 0; j < state.length; j++) {
                const item = state[j];
                const rule = grammar[item.ruleIndex];
                if (item.dot < rule.rhs.length) {
                    symbols.add(rule.rhs[item.dot]);
                }
            }
            for (const symbol of symbols) {
                const nextState = goto(state, symbol, grammar);
                if (!nextState.length) {
                    continue;
                }
                if (!states.some((state) => itemsAreEqual(state, nextState))) {
                    states.push(nextState);
                    changed = true;
                }
            }
        }
    }

    return states;
}

const findTransitionState = (states: LR1Item[][], fromState: LR1Item[], symbol: string): number => {
    for (let i = 0; i < states.length; i++) {
        if (itemsAreEqual(goto(fromState, symbol, grammar), states[i])) {
            return i;
        }
    }
    throw new Error(`Transition state not found`);
}

export const generateActionGotoTables = (states: LR1Item[][], grammar: Rule[]): {
    actionTable: ActionTable,
    gotoTable: GotoTable
} => {
    const actionTable: ActionTable = {};
    const gotoTable: GotoTable = {};

    for (let i = 0; i < states.length; i++) {
        actionTable[i] = {};
        gotoTable[i] = {};
    }

    for (let i = 0; i < states.length; i++) {
        const state = states[i];
        for (let j = 0; j < state.length; j++) {
            const item = state[j];
            const rule = grammar[item.ruleIndex];
            if (item.dot === rule.rhs.length) {
                if (item.ruleIndex === 0) {
                    actionTable[i]['$'] = {type: 'ACCEPT'};
                } else {
                    for (const lookahead of item.lookahead.split(' ')) {
                        actionTable[i][lookahead] = {type: 'REDUCE', productionNumber: item.ruleIndex};
                    }
                }
            } else {
                const symbol = rule.rhs[item.dot];
                if (isTerminal(symbol)) {
                    const nextState = findTransitionState(states, state, symbol);
                    actionTable[i][symbol] = {type: 'SHIFT', nextState};
                } else {
                    gotoTable[i][symbol] = findTransitionState(states, state, symbol);
                }
            }
        }
    }

    return {actionTable, gotoTable};
}

export class SyntaxTreeNode {
    constructor(public type: string, public value: string, public children: SyntaxTreeNode[] = []) {
    }
}

export class SyntaxTree {
    constructor(public root: SyntaxTreeNode) {
    }
}


export class LR1Parser {
    private readonly actionTable: ActionTable;
    private readonly gotoTable: GotoTable;
    private tokenStream: Token[] = [];
    private stack: LR1StackItem[] = [];
    private stateStack: number[] = [];
    private readonly grammar: Rule[];

    private nodeStack: SyntaxTreeNode[] = [];
    private syntaxTree?: SyntaxTree;

    private traceTable: {
        stack: string,
        symbol: string,
        input: string,
        action: string
    }[] = [];

    constructor(grammar: Rule[], actionTable: ActionTable, gotoTable: GotoTable) {
        this.grammar = grammar;
        this.actionTable = actionTable;
        this.gotoTable = gotoTable;
    }

    private shift(state: number, symbol: string, value?: string) {
        this.stateStack.push(state);
        this.stack.push({state, symbol, value});

        this.traceTable.push({
            stack: this.stateStack.join(' '),
            symbol: this.stack.map((item) => item.symbol).join(' '),
            input: symbol,
            action: `Shift ${state}`
        });
    }

    private reduce(rule: Rule) {
        const poppedStates = rule.rhs.map(() => this.stateStack.pop());
        const poppedSymbols = rule.rhs.map(() => this.stack.pop());
        const nextState = this.stateStack[this.stateStack.length - 1];
        this.stateStack.push(this.gotoTable[nextState][rule.lhs]);
        this.stack.push({state: this.stateStack[this.stateStack.length - 1], symbol: rule.lhs});

        // 如果是空产生式，不输出
        if (rule.rhs.length === 0) {
            return;
        }

        this.traceTable.push({
            stack: this.stateStack.join(' '),
            symbol: this.stack.map((item) => item.symbol).join(' '),
            input: rule.lhs,
            action: `Reduce ${rule.lhs} → ${rule.rhs.join(' ')}`
        });

        const children: SyntaxTreeNode[] = [];
        for (let i = rule.rhs.length - 1; i >= 0; i--) {
            if (isNonTerminal(rule.rhs[i])) {
                if (this.nodeStack.at(-1)?.type === rule.rhs[i]) {
                    const child = this.nodeStack.pop();
                    child && children.push(child);
                }
            } else {
                children.push(new SyntaxTreeNode(rule.rhs[i], poppedSymbols[rule.rhs.length - 1 - i]?.value || rule.rhs[i]));
            }
        }

        this.nodeStack.push(new SyntaxTreeNode(rule.lhs, rule.lhs, children.reverse()));
    }


    private getSymbolFromToken(token: Token): string {
        switch (token.type) {
            case 'RESERVED_WORD':
            case 'SEPARATOR':
            case 'OPERATOR':
            case 'BASIC':
                return token.value;
            case 'IDENTIFIER':
                return 'id';
            case 'CONSTANT':
                return 'num';
            case 'EOF':
                return '$';
            default:
                throw new Error(`Unexpected token type ${token.type}`);
        }
    }

    public parse(tokenStream: Token[]): void {
        this.tokenStream = tokenStream;
        this.stateStack = [0];
        let tokenIndex = 0;

        while (tokenIndex < this.tokenStream.length) {
            const token = this.tokenStream[tokenIndex];
            const currentState = this.stateStack[this.stateStack.length - 1];
            const action = this.actionTable[currentState][this.getSymbolFromToken(token)];

            if (!action) {
                if (this.actionTable[currentState]?.['$']?.type === 'REDUCE') {
                    this.reduce(this.grammar[this.actionTable[currentState]['$'].productionNumber!!]);
                    continue;
                }
                throw new Error(`Unexpected token ${token.value} at line ${token.line}, column ${token.column}`);
            }
            switch (action.type) {
                case 'SHIFT':
                    this.shift(action.nextState!!, this.getSymbolFromToken(token), token.value);
                    tokenIndex++;
                    break;
                case 'REDUCE':
                    this.reduce(this.grammar[action.productionNumber!!]);
                    break;
                case 'ACCEPT':
                    this.traceTable.push({
                        stack: this.stateStack.join(' '),
                        symbol: this.stack.map((item) => item.symbol).join(' '),
                        input: token.value,
                        action: `Accept`
                    });
                    this.syntaxTree = new SyntaxTree(this.nodeStack[0]);
                    return;
                case 'ERROR':
                    throw new Error(`Unexpected token ${token.value} at line ${token.line}, column ${token.column}`);
            }
        }

        throw new Error(`Unexpected end of input`);
    }

    public log() {
        console.table(this.traceTable);
    }

    public getSyntaxTree(): SyntaxTree {
        if (!this.syntaxTree) {
            throw new Error("AST not generated");
        }
        return this.syntaxTree;
    }
}
