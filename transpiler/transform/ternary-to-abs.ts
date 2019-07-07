
import { FileAST, Node, TernaryOp, BinaryOp, Constant, UnaryOp, FuncCall } from '../ast';

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

                    const cond = child.cond.left.exportAsWebGL();
                    const negIftrue = child.iftrue.expr.exportAsWebGL();
                    const iffalse = child.iffalse.exportAsWebGL();

                    if (cond === negIftrue && cond === iffalse) {
                        const call = new FuncCall({
                            _nodetype: 'FuncCall',
                            coord: 'transform/ternary-to-abs.js',
                            name: {
                                _nodetype: 'ID',
                                coord: 'transform/ternary-to-abs.js',
                                name: 'abs'
                            },
                            args: {
                                _nodetype: 'ExprList',
                                coord: 'transform/ternary-to-abs.js',
                                exprs: [child.iffalse]
                            }
                        });

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
