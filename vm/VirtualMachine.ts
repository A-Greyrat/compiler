// 中间代码格式
// = arg1 null result -> result = arg1
// + arg1 arg2 result -> result = arg1 + arg2
// - arg1 arg2 result -> result = arg1 - arg2
// * arg1 arg2 result -> result = arg1 * arg2
// / arg1 arg2 result -> result = arg1 / arg2
// label null null label -> label:
// jmp null null label -> goto label
// jfalse arg1 null label -> if arg1 is false goto label
// jtrue arg1 null label -> if arg1 is true goto label
// [] arg1 index result -> result = arg1[index]
// == arg1 arg2 result -> result = arg1 == arg2
// != arg1 arg2 result -> result = arg1 != arg2
// > arg1 arg2 result -> result = arg1 > arg2
// < arg1 arg2 result -> result = arg1 < arg2
// >= arg1 arg2 result -> result = arg1 >= arg2
// <= arg1 arg2 result -> result = arg1 <= arg2
// && arg1 arg2 result -> result = arg1 && arg2
// || arg1 arg2 result -> result = arg1 || arg2
// ! arg1 null result -> result = !arg1
// - arg1 null result -> result = -arg1


import {Symbol, SymbolTable} from "../symbol";
import {Quadruple} from "../parser/LR1Parser";


export class ArrayItem {
    private symbol: Symbol;
    private readonly index: number;

    constructor(symbol: Symbol, index: number) {
        this.symbol = symbol;
        this.index = index;
    }

    public get value() {
        if (!Array.isArray(this.symbol.value)) {
            throw new Error(`Symbol ${this.symbol.identifier} is not an array`);
        }
        return this.symbol.value[this.index];
    }

    public set value(value: any) {
        if (!Array.isArray(this.symbol.value)) {
            throw new Error(`Symbol ${this.symbol.identifier} is not an array`);
        }
        this.symbol.value[this.index] = value;
    }
}

export class VirtualMachine {
    private readonly code: Quadruple[];
    private readonly stack: any[];
    private symbolTable: SymbolTable;
    private pc: number;

    constructor(code: Quadruple[], symbolTable: SymbolTable) {
        this.code = code;
        this.symbolTable = symbolTable;
        this.stack = [];
        this.pc = 0;
    }

    private getSymbol(identifier: string) {
        if (identifier.startsWith('T ')) {
            return this.stack.pop();
        } else if (identifier.startsWith('C ')) {
            const c = identifier.substring(2);
            if (c === 'true') {
                return true;
            } else if (c === 'false') {
                return false;
            } else {
                return parseFloat(c);
            }
        } else {
            return this.symbolTable.getSymbol(identifier)!.value;
        }
    }

    public run() {
        while (this.pc < this.code.length) {
            const instruction = this.code[this.pc];

            switch (instruction.op) {
                case '=':
                    let s;
                    if (instruction.result!.startsWith('T ')) {
                        s = this.stack.pop();
                    }else {
                        s = this.symbolTable.getSymbol(instruction.result!);
                    }
                    s.value = this.getSymbol(instruction.arg1!);
                    break;
                case '+':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) + (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '-':
                    // 判断是减号还是负号
                    if (instruction.arg2) {
                        this.stack.push((this.getSymbol(instruction.arg1!) as number) - (this.getSymbol(instruction.arg2!) as number));
                    } else {
                        this.stack.push(-(this.getSymbol(instruction.arg1!) as number));
                    }
                    break;
                case '*':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) * (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '/':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) / (this.getSymbol(instruction.arg2!) as number));
                    break;
                case 'label':
                    break;
                case 'jmp':
                    for (let i = 0; i < this.code.length; i++) {
                        if (this.code[i].op === 'label' && this.code[i].result === instruction.result) {
                            this.pc = i;
                            break;
                        }
                    }
                    break;
                case 'jfalse':
                    if (!this.getSymbol(instruction.arg1!)) {
                        for (let i = 0; i < this.code.length; i++) {
                            if (this.code[i].op === 'label' && this.code[i].result === instruction.result) {
                                this.pc = i;
                                break;
                            }
                        }
                    }
                    break;
                case 'jtrue':
                    if (this.getSymbol(instruction.arg1!)) {
                        for (let i = 0; i < this.code.length; i++) {
                            if (this.code[i].op === 'label' && this.code[i].result === instruction.result) {
                                this.pc = i;
                                break;
                            }
                        }
                    }
                    break;
                case '[]':
                    this.stack.push(new ArrayItem(this.symbolTable.getSymbol(instruction.arg1!)!, this.getSymbol(instruction.arg2!) as number));
                    break;
                case '==':
                    this.stack.push(this.getSymbol(instruction.arg1!) === this.getSymbol(instruction.arg2!));
                    break;
                case '!=':
                    this.stack.push(this.getSymbol(instruction.arg1!) !== this.getSymbol(instruction.arg2!));
                    break;
                case '>':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) > (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '<':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) < (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '>=':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) >= (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '<=':
                    this.stack.push((this.getSymbol(instruction.arg1!) as number) <= (this.getSymbol(instruction.arg2!) as number));
                    break;
                case '&&':
                    this.stack.push(this.getSymbol(instruction.arg1!) && this.getSymbol(instruction.arg2!));
                    break;
                case '||':
                    this.stack.push(this.getSymbol(instruction.arg1!) || this.getSymbol(instruction.arg2!));
                    break;
                case '!':
                    this.stack.push(!this.getSymbol(instruction.arg1!));
                    break;
                case 'print':
                    console.log(this.getSymbol(instruction.arg1!));
                    break;
                default:
                    throw new Error(`Unknown instruction: ${instruction.op}`);
            }

            this.pc++;
        }
    }

}
