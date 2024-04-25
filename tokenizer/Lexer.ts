import {Token, TokenType} from "./Token";
import {StartState, State} from "./State";


export class Lexer {
    private readonly sourceCode: string;
    private currentIndex: number;

    private lastLine: number;
    private lastColumn: number;
    private currentLine: number;
    private currentColumn: number;

    private tokens: Token[] = [];
    private state: State;

    private symbolTable: Set<string> = new Set<string>();

    constructor(code: string) {
        this.sourceCode = code;
        this.currentIndex = 0;
        this.currentLine = 1;
        this.currentColumn = 1;
        this.lastLine = 1;
        this.lastColumn = 1;
        this.state = new StartState(this);
    }

    public tokenize(): Token[] {
        while (!this.isAtEnd()) {
            this.state = this.state.getNextState();
        }

        this.tokens.push(new Token(TokenType.EOF, "", this.currentLine, this.currentColumn - 1));

        this.tokens.forEach((token) => {
            if (token.type === TokenType.ERROR) {
                throw new Error(`Unexpected token ${token.value} at line ${token.line} column ${token.column}`);
            }
        });

        return this.tokens;
    }

    public addToken(type: TokenType, value: string): void {
        if (type === TokenType.WHITESPACE || type === TokenType.COMMENT) {
            this.lastLine = this.currentLine;
            this.lastColumn = this.currentColumn;
            return;
        }

        if (type === TokenType.IDENTIFIER) {
            this.symbolTable.add(value);
        }

        this.tokens.push(new Token(type, value, this.lastLine, this.lastColumn));
        this.lastLine = this.currentLine;
        this.lastColumn = this.currentColumn;
    }

    public getSymbolTable(): Set<string> {
        return this.symbolTable;
    }

    public isAtEnd() {
        return this.currentIndex >= this.sourceCode.length;
    }

    public isDigit(lookahead: string) {
        return lookahead >= '0' && lookahead <= '9';
    }

    public advance() {
        this.currentIndex++;
        this.currentColumn++;
        if (this.sourceCode[this.currentIndex - 1] === '\n') {
            this.currentLine++;
            this.currentColumn = 1;
        }
        return this.sourceCode[this.currentIndex - 1];
    };

    public peek(following: number = 0) {
        if (this.currentIndex + following >= this.sourceCode.length) {
            return '\0';
        }
        return this.sourceCode[this.currentIndex + following];
    }

    public isAlpha(lookahead: string) {
        return (lookahead >= 'a' && lookahead <= 'z') || (lookahead >= 'A' && lookahead <= 'Z');
    }
}
