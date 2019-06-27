
import { FileAST, Node, Cast, FuncCall, TypeDecl } from '../ast';

export function castToCall(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node, TT extends Node>(
            child: T, parent: TT
        ): T {
            if (child instanceof Cast) {
                // Convert Cast to FuncCall
                if (!(child.to_type.type instanceof TypeDecl)) {
                    throw new TypeError(
                        `unexpected type: ${child.to_type.type._nodetype}`
                    );
                }
                const typeName = child.to_type.type.type.names.join('');

                return new FuncCall({
                    _nodetype: 'FuncCall',
                    coord: 'transform/cast-to-call.ts',
                    name: {
                        _nodetype: 'ID',
                        coord: 'transform/cast-to-call.ts',
                        name: typeName
                    },
                    args: {
                        _nodetype: 'ExprList',
                        coord: 'transform/cast-to-call.ts',
                        exprs: [child.expr]
                    }
                }) as Node as T;
            } else {
                child.transformChildren(transform);
            }

            return child;
        }
    );
}
