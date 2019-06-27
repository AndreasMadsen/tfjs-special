
import { FileAST, FuncDef, Node, FuncCall, Constant, Decl, FuncDecl } from '../ast';

function isRecursiveFunCall(func: FuncDef, child: Node): child is FuncCall {
    return (child instanceof FuncCall &&
            child.name.name === func.decl.name);
}

export function unrollRecursiveCall(basename: string, ast: FileAST): FileAST {
    const insertFunctions: FuncDef[] = [];

    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            const funcName = func.decl.name;

            // Detect recursive calls
            let detectedRecursiveCall = false;
            func.transformChildren(
                function transform<T extends Node>(child: T): T {
                    if (isRecursiveFunCall(func, child)) {
                        detectedRecursiveCall = true;
                    }
                    return child.transformChildren(transform);
                }
            );

            if (detectedRecursiveCall) {
                if (!(func.decl.type instanceof FuncDecl)) {
                    throw new Error('unexpected declaration type');
                }

                const funcRecursive = new FuncDef({
                    _nodetype: 'FuncDef',
                    coord: 'transform/unroll-recursive-call.js',
                    decl: {
                        _nodetype: 'Decl',
                        coord: 'transform/unroll-recursive-call.js',
                        bitsize: func.decl.bitsize,
                        funcspec: func.decl.funcspec,
                        init: func.decl.init,
                        name: `${basename}_${funcName}_recursive`,
                        quals: func.decl.quals,
                        storage: func.decl.storage,
                        type: {
                            _nodetype: 'FuncDecl',
                            coord: 'transform/unroll-recursive-call.js',
                            args: func.decl.type.args,
                            type: {
                                _nodetype: 'TypeDecl',
                                coord: 'transform/unroll-recursive-call.js',
                                declname: `${basename}_${funcName}_recursive`,
                                quals: func.decl.type.type.quals,
                                type: func.decl.type.type.type
                            }
                        }
                    },
                    param_decls: func.param_decls,
                    body: func.body
                });

                // Replace recursive function call with an __recursive call
                func.transformChildren(
                    function transform<T extends Node>(child: T): T {
                        if (isRecursiveFunCall(func, child)) {
                            child = new FuncCall({
                                _nodetype: 'FuncCall',
                                coord: 'transform/unroll-recursive-call.js',
                                name: {
                                    _nodetype: 'ID',
                                    coord: 'transform/unroll-recursive-call.js',
                                    name: `${basename}_${funcName}_recursive`
                                },
                                args: child.args
                            }) as Node as T;
                        }
                        return child.transformChildren(transform);
                    }
                );

                // Replace recursive call with NAN constant
                funcRecursive.transformChildren(
                    function transform<T extends Node>(child: T): T {
                        if (isRecursiveFunCall(func, child)) {
                            child = new Constant({
                                _nodetype: 'Constant',
                                coord: 'transform/unroll-recursive-call.js',
                                type: 'float',
                                value: 'NAN'
                            }) as Node as T;
                        }
                        return child.transformChildren(transform);
                    }
                );

                // Mark funcRecursive for insertion into the ast
                insertFunctions.push(funcRecursive);
            }
        }
    }

    for (const func of insertFunctions) {
        ast.ext.push(func);
        ast.ext.unshift(new Decl(func.decl));
    }

    return ast;
}
