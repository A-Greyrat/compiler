import {SyntaxTree, SyntaxTreeNode} from "../parser";


export class Translator {
    // 1． 输出语法分析过程；
    // 2． 输出中间代码，要求三地址代码；
    // 在自底向上语法分析基础上设计语义规则（语法制导翻译），将源程序翻译为四元式输出，若有错误将错误信息输出。

    private ast: SyntaxTree;

    constructor(ast: SyntaxTree) {
        this.ast = ast;
    }

    public generateIntermediateCode(): void {

    }

}
