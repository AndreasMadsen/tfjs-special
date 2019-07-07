
import { FileAST, Node, FuncCall, BinaryOp, Constant, Decl } from '../ast';

export function binaryToOddCheck(ast: FileAST): FileAST {
    let usingIsOdd = false;

    ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            // If it is a binary 'and' op
            if (child instanceof BinaryOp && child.op === '&') {
                // Convert (x & 1) to is_odd(x)
                const constSide: 'left'|'right' = (
                    child.left instanceof Constant ? 'left' : 'right'
                );
                const otherSide: 'left'|'right' = (
                    child.left instanceof Constant ? 'right' : 'left'
                );

                const constExpr = child[constSide];
                const otherExpr = child[otherSide];
                let funcName: string = null;

                if (constExpr instanceof Constant) {
                    if (constExpr.value === '1') {
                        funcName = 'is_odd';
                        usingIsOdd = true;
                    }
                }

                // If an appropate function is found, replace the binary 'and'
                // op with is_odd.
                if (funcName !== null) {
                    return new FuncCall({
                        _nodetype: 'FuncCall',
                        coord: 'transform/binary-to-odd-check.ts',
                        name: {
                            _nodetype: 'ID',
                            coord: 'transform/binary-to-odd-check.ts',
                            name: funcName
                        },
                        args: {
                            _nodetype: 'ExprList',
                            coord: 'transform/binary-to-odd-check.ts',
                            exprs: [otherExpr.transformChildren(transform)]
                        }
                    }) as Node as T;
                }
            }

            return child.transformChildren(transform);
        }
    );

    if (usingIsOdd) {
        ast.ext.unshift(new Decl({
            '_nodetype': 'Decl',
            'bitsize': null,
            'coord': 'transform/binary-to-odd-check.ts',
            'funcspec': [],
            'init': null,
            'name': 'is_odd',
            'quals': [],
            'storage': [],
            'type': {
                '_nodetype': 'FuncDecl',
                'args': {
                    '_nodetype': 'ParamList',
                    'coord': 'transform/binary-to-odd-check.ts',
                    'params': [
                        {
                            '_nodetype': 'Typename',
                            'coord': 'transform/binary-to-odd-check.ts',
                            'name': null,
                            'quals': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': null,
                                'declname': null,
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'transform/binary-to-odd-check.ts',
                                    'names': [
                                        'int'
                                    ]
                                }
                            }
                        }
                    ]
                },
                'coord': 'transform/binary-to-odd-check.ts',
                'type': {
                    '_nodetype': 'TypeDecl',
                    'coord': 'transform/binary-to-odd-check.ts',
                    'declname': 'is_odd',
                    'quals': [],
                    'type': {
                        '_nodetype': 'IdentifierType',
                        'coord': 'transform/binary-to-odd-check.ts',
                        'names': [
                            'int'
                        ]
                    }
                }
            }
        }));
    }

    return ast;
}
