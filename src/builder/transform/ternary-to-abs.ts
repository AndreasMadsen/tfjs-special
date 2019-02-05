
import { FileAST, Node, TernaryOp, BinaryOp, Constant, UnaryOp, FuncCall, ID, ExprList } from '../ast';

// #define fabsf(x) ((x) < 0 ? -(x) : (x))

export function ternaryToAbs(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof TernaryOp) {
                if (child.cond instanceof BinaryOp &&
                    child.cond.op === '<' &&
                    child.cond.right instanceof Constant &&
                    child.cond.right.value === '0' &&
                    child.iftrue instanceof UnaryOp &&
                    child.iftrue.op === '-') {

                    const cond = child.cond.left.exportAsCode();
                    const negIftrue = child.iftrue.expr.exportAsCode();
                    const iffalse = child.iffalse.exportAsCode();

                    if (cond === negIftrue && cond === iffalse) {
                        const call = new FuncCall({
                            _nodetype: 'FuncCall',
                            coord: 'transform/ternary-to-abs.js',
                            name: new ID({
                                _nodetype: 'ID',
                                coord: 'transform/ternary-to-abs.js',
                                name: 'abs'
                            } as ID),
                            args: new ExprList({
                                _nodetype: 'ExprList',
                                coord: 'transform/ternary-to-abs.js',
                                exprs: [child.iffalse]
                            } as ExprList)
                        } as FuncCall);

                        return call as Node as T;
                    }
                }
            } else {
                child.transformChildren(transform);
            }

            return child;
        }
    );
}
