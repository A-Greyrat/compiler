export enum TokenType {
    EOF = "EOF",
    RESERVED_WORD = "RESERVED_WORD",
    IDENTIFIER = "IDENTIFIER",
    BASIC = "BASIC",
    CONSTANT = "CONSTANT",
    STRING = "STRING",
    OPERATOR = "OPERATOR",
    SEPARATOR = "SEPARATOR",
    COMMENT = "COMMENT",
    WHITESPACE = "WHITESPACE",
    ERROR = "ERROR"
}

export class Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;

    constructor(type: TokenType, value: string, line: number, column: number) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }

    toString() {
        return `Token(${this.type}, ${this.value}, ${this.line}, ${this.column})`;
    }
}

