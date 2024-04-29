export interface Rule {
    lhs: string;
    rhs: string[];
}

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


export const grammar: Rule[] = [
    // program → block
    {lhs: "program", rhs: ["block"]},

    // block→{ decls stmts }
    {lhs: "block", rhs: ["{", "decls", "stmts", "}"]},

    // decls → decls decl | ε
    {lhs: "decls", rhs: ["decls", "decl"]},
    {lhs: "decls", rhs: []},
    // {lhs: "decls", rhs: ["stmts"]},

    // decl → type id | type id(defArgs) block
    {lhs: "decl", rhs: ["type", "id", ";"]},
    {lhs: "decl", rhs: ["type", "id", "(", "defArgs", ")", "block"]},

    // defArgs → type id | type id, defArgs
    {lhs: "defArgs", rhs: ["type", "id"]},
    {lhs: "defArgs", rhs: ["type", "id", ",", "defArgs"]},

    // type → type[num] | int | double | bool
    {lhs: "type", rhs: ["array"]},
    {lhs: "type", rhs: ["int"]},
    {lhs: "type", rhs: ["double"]},
    {lhs: "type", rhs: ["boolean"]},

    {lhs: "array", rhs: ["type", "[", "num", "]"]},
    {lhs: "array", rhs: ["type", "[", "]"]},

    // stmts → stmts stmt | ε
    {lhs: "stmts", rhs: ["stmts", "stmt"]},
    {lhs: "stmts", rhs: []},
    // {lhs: "stmts", rhs: ["decls"]},

    // stmt → loc=bool; | if(bool)stmt | if(bool)stmt else stmt | while(bool)stmt | do stmt while(bool); | break; | block | func | return bool;
    {lhs: "stmt", rhs: ["loc", "=", "bool", ";"]},
    {lhs: "stmt", rhs: ["if", "(", "bool", ")", "block"]},
    {lhs: "stmt", rhs: ["if", "(", "bool", ")", "block", "else", "block"]},
    {lhs: "stmt", rhs: ["while", "(", "bool", ")", "block"]},
    {lhs: "stmt", rhs: ["do", "block", "while", "(", "bool", ")", ";"]},
    {lhs: "stmt", rhs: ["break", ";"]},
    {lhs: "stmt", rhs: ["block"]},
    {lhs: "stmt", rhs: ["func"]},
    {lhs: "stmt", rhs: ["return", "bool", ";"]},

    // func → id ( args ) ; | id ( ) ;
    {lhs: "func", rhs: ["id", "(", "args", ")", ";"]},
    {lhs: "func", rhs: ["id", "(", ")", ";"]},

    // args → args , bool | bool
    {lhs: "args", rhs: ["args", ",", "bool"]},
    {lhs: "args", rhs: ["bool"]},

    // Loc → loc[num] | id
    {lhs: "loc", rhs: ["loc", "[", "num", "]"]},
    {lhs: "loc", rhs: ["id"]},

    // bool → bool || join | join
    {lhs: "bool", rhs: ["bool", "||", "join"]},
    {lhs: "bool", rhs: ["join"]},

    // join → join && equality | equality
    {lhs: "join", rhs: ["join", "&&", "equality"]},
    {lhs: "join", rhs: ["equality"]},

    // equality → equality == rel | equality != rel | rel
    {lhs: "equality", rhs: ["equality", "==", "rel"]},
    {lhs: "equality", rhs: ["equality", "!=", "rel"]},
    {lhs: "equality", rhs: ["rel"]},

    // rel → expr < expr | expr <= expr | expr >= expr | expr > expr | expr
    {lhs: "rel", rhs: ["expr", "<", "expr"]},
    {lhs: "rel", rhs: ["expr", "<=", "expr"]},
    {lhs: "rel", rhs: ["expr", ">=", "expr"]},
    {lhs: "rel", rhs: ["expr", ">", "expr"]},
    {lhs: "rel", rhs: ["expr"]},

    // expr → expr + term | expr - term | term
    {lhs: "expr", rhs: ["expr", "+", "term"]},
    {lhs: "expr", rhs: ["expr", "-", "term"]},
    {lhs: "expr", rhs: ["term"]},

    // term → term * unary | term / unary | unary | term % unary
    {lhs: "term", rhs: ["term", "*", "unary"]},
    {lhs: "term", rhs: ["term", "/", "unary"]},
    {lhs: "term", rhs: ["term", "%", "unary"]},
    {lhs: "term", rhs: ["unary"]},

    // unary → !unary | -unary | factor
    {lhs: "unary", rhs: ["!", "unary"]},
    {lhs: "unary", rhs: ["-", "unary"]},
    {lhs: "unary", rhs: ["factor"]},

    // factor→ (expr) | loc | num | real | true | false
    {lhs: "factor", rhs: ["(", "bool", ")"]},
    {lhs: "factor", rhs: ["loc"]},
    {lhs: "factor", rhs: ["num"]},
    {lhs: "factor", rhs: ["real"]},
    {lhs: "factor", rhs: ["true"]},
    {lhs: "factor", rhs: ["false"]},

];

export const reservedWords = [
    "if",
    "else",
    "while",
    "do",
    "break",
    "true",
    "false",
    "return",
];

export const basicTypes = [
    "int",
    "double",
    "boolean"
];

export const terminals = [
    ...reservedWords,
    ...basicTypes,
    "ε",
    "id",
    "num",
    "real",
    "||",
    ";",
    ",",
    "(",
    ")",
    "{",
    "}",
    "+",
    "-",
    "*",
    "/",
    "%",
    "!",
    "<",
    ">",
    "<=",
    ">=",
    "==",
    "!=",
    "&&",
    "||",
    "=",
    "[",
    "]",
    "$",
];

export const nonTerminals = [
    "program",
    "block",
    "decls",
    "decl",
    "type",
    "stmts",
    "stmt",
    "loc",
    "bool",
    "join",
    "equality",
    "rel",
    "expr",
    "term",
    "unary",
    "factor",
    "array",
    "args",
    "func",
    "defArgs"
];

export const isTerminal = (symbol: string): boolean => {
    return terminals.includes(symbol);
}

export const isNonTerminal = (symbol: string): boolean => {
    return nonTerminals.includes(symbol);
}

