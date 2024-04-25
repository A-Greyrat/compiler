import {Lexer} from "./Lexer";
import {TokenType} from "./Token";
import {reservedWords, basicTypes} from "../parser/Grammar";

export interface State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    getNextState(): State;
}

export class StartState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.WHITESPACE;
        this.value = "";
    }

    getNextState(): State {
        switch (this.lexer.peek()) {
            case ' ':
            case '\n':
            case '\r':
            case '\t':
                this.lexer.advance();
                this.lexer.addToken(this.type, this.value);
                return new StartState(this.lexer);
            case ';':
            case ',':
            case '(':
            case ')':
            case '{':
            case '}':
            case '[':
            case ']':
                return new SeparatorState(this.lexer);
            case '+':
                if (this.lexer.peek(1) === '+' || this.lexer.peek(1) === '=') {
                    return new OperatorState(this.lexer, 2);
                }
                return new OperatorState(this.lexer);
            case '-':
                if (this.lexer.peek(1) === '-' || this.lexer.peek(1) === '=') {
                    return new OperatorState(this.lexer, 2);
                }
                return new OperatorState(this.lexer);
            case '&':
            case '|':
                if (this.lexer.peek(1) === this.lexer.peek()) {
                    return new OperatorState(this.lexer, 2);
                }
                if (this.lexer.peek(1) === '=') {
                    return new OperatorState(this.lexer, 2);
                }
                return new OperatorState(this.lexer);
            case '*':
            case '^':
            case '!':
            case '%':
            case '<':
            case '>':
            case '=':
                if (this.lexer.peek(1) === '=') {
                    return new OperatorState(this.lexer,2);
                }
                return new OperatorState(this.lexer);
            case '/':
                if (this.lexer.peek(1) === '/') {
                    return new CommentState(this.lexer);
                }
                if (this.lexer.peek(1) === '=') {
                    return new OperatorState(this.lexer, 2);
                }
                return new OperatorState(this.lexer);
            case '"':
                this.lexer.advance();
                return new StringState(this.lexer);
            default:
                if (this.lexer.isDigit(this.lexer.peek())) {
                    return new NumberState(this.lexer);
                }
                if (this.lexer.isAlpha(this.lexer.peek())) {
                    return new IdentifierState(this.lexer);
                }
                return new ErrorState(this.lexer);
        }
    }
}

export class IdentifierState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.IDENTIFIER;
        this.value = "";
    }

    getNextState(): State {
        while (!this.lexer.isAtEnd() && (this.lexer.isAlpha(this.lexer.peek()) || this.lexer.isDigit(this.lexer.peek()))) {
            this.value += this.lexer.advance();
        }

        if (reservedWords.includes(this.value)) {
            this.lexer.addToken(TokenType.RESERVED_WORD, this.value);
            return new StartState(this.lexer);
        }

        if (basicTypes.includes(this.value)) {
            this.lexer.addToken(TokenType.BASIC, this.value);
            return new StartState(this.lexer);
        }

        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class NumberState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.CONSTANT;
        this.value = "";
    }

    getNextState(): State {
        let isReal = false;
        while (!this.lexer.isAtEnd() && (this.lexer.isDigit(this.lexer.peek()) || (!isReal && this.lexer.peek() === '.'))) {
            if (this.lexer.peek() === '.') {
                isReal = true;
            }
            this.value += this.lexer.advance();
        }

        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class StringState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.STRING;
        this.value = "";
    }

    getNextState(): State {
        while (!this.lexer.isAtEnd() && this.lexer.peek() !== '"') {
            this.value += this.lexer.advance();
        }

        this.lexer.advance();
        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class OperatorState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;
    private readonly length: number;

    constructor(lexer: Lexer, length: number = 1) {
        this.lexer = lexer;
        this.type = TokenType.OPERATOR;
        this.value = "";
        this.length = length;
    }

    getNextState(): State {
        for (let i = 0; i < this.length; i++) {
            this.value += this.lexer.advance();
        }
        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class SeparatorState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.SEPARATOR;
        this.value = "";
    }

    getNextState(): State {
        this.value = this.lexer.advance();
        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class CommentState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.COMMENT;
        this.value = "";
    }

    getNextState(): State {
        while (!this.lexer.isAtEnd() && this.lexer.peek() !== '\n') {
            this.value += this.lexer.advance();
        }

        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}

export class ErrorState implements State {
    lexer: Lexer;
    type: TokenType;
    value: string;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.type = TokenType.ERROR;
        this.value = "";
    }

    getNextState(): State {
        while (!this.lexer.isAtEnd() && this.lexer.peek() !== ' ') {
            this.value += this.lexer.advance();
        }

        this.lexer.addToken(this.type, this.value);
        return new StartState(this.lexer);
    }
}



