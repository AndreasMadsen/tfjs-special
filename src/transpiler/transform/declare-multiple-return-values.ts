
import { FileAST, Node, Decl, FuncDef, FuncDecl, ID, UnaryOp,
         InOutDecl, PtrDecl,
         Return, ReturnMultipleValues,
         FuncCall, FuncCallMultipleReturns,
         FuncCallMultipleReturnTempVariable,
         Assignment} from '../ast';

function declareReturnArgumentsAsInOut(decl: FuncDecl): string[] {
    const extraReturns: string[] = [];

    decl.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof PtrDecl) {
                extraReturns.push(child.type.declname);

                return new InOutDecl({
                    _nodetype: 'InOutDecl',
                    coord: 'transform/declare-multiple-return-values.ts',
                    type: child.type
                }) as Node as T;
            }

            return child.transformChildren(transform);
        }
    );

    return extraReturns;
}

function convertPointerValueAssignment(func: FuncDef) {
    func.body.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Assignment &&
                child.lvalue instanceof UnaryOp &&
                child.lvalue.op === '*' &&
                child.lvalue.expr instanceof ID) {
                child.lvalue = child.lvalue.expr;
            }

            return child.transformChildren(transform);
        }
    );
}

function declareReturnStatementAsMultipleReturn(
    func: FuncDef, extraReturns: string[]
) {
    func.body.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Return) {
                return new ReturnMultipleValues({
                    _nodetype: 'ReturnMultipleValues',
                    coord: 'transform/declare-multiple-return-values.ts',
                    main: child.expr,
                    extra: extraReturns.map((variableName) => ({
                        _nodetype: 'ID',
                        coord: 'transform/declare-multiple-return-values.ts',
                        name: variableName
                    }))
                }) as Node as T;
            }

            return child.transformChildren(transform);
        }
    );
}

function convertFuncCallWithPointerToFuncCallMultipleReturn(func: FuncDef) {
    let foundMultipleReturnCall = false;

    // Find and transform FuncCalls
    func.body.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof FuncCall) {
                // check for pointers in arguments
                const pointerArgs: ID[] = [];
                for (const arg of child.args.exprs) {
                    if (arg instanceof UnaryOp && arg.op === '&' &&
                        arg.expr instanceof ID) {
                        pointerArgs.push(arg.expr);
                    }
                }

                // No pointers found, do nothing
                if (pointerArgs.length === 0) {
                    return child.transformChildren(transform);
                }

                foundMultipleReturnCall = true;

                return new FuncCallMultipleReturns({
                    _nodetype: 'FuncCallMultipleReturns',
                    coord: 'transform/declare-multiple-return-values.ts',
                    name: child.name,
                    args: {
                        _nodetype: 'ExprList',
                        coord: 'transform/declare-multiple-return-values.ts',
                        exprs: child.args.exprs.map(function map(arg) {
                            if (arg instanceof UnaryOp && arg.op === '&' &&
                                arg.expr instanceof ID) {
                                return arg.expr;
                            } else {
                                return arg.transformChildren(transform);
                            }
                        })
                    },
                    extra: pointerArgs
                }) as Node as T;
            }

            return child.transformChildren(transform);
        }
    );

    // Add a _mainReturn declaration that will be used in the JS
    if (foundMultipleReturnCall) {
        func.body.block_items.unshift(new FuncCallMultipleReturnTempVariable({
            _nodetype: 'FuncCallMultipleReturnTempVariable',
            coord: 'transform/declare-multiple-return-values.ts'
        }));
    }
}

export function declareMultipleReturnValues(ast: FileAST): FileAST {
    // Declare arguments and return statement in function defintions
    for (const func of ast.ext) {
        if (func instanceof FuncDef && func.decl.type instanceof FuncDecl) {
            const extraReturns = declareReturnArgumentsAsInOut(func.decl.type);
            if (extraReturns.length > 0) {
                convertPointerValueAssignment(func);
                declareReturnStatementAsMultipleReturn(func, extraReturns);
            }
        }
    }

    // Transform function declarations
    for (const decl of ast.ext) {
        if (decl instanceof Decl && decl.type instanceof FuncDecl) {
            declareReturnArgumentsAsInOut(decl.type);
        }
    }

    // Transform calls
    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            convertFuncCallWithPointerToFuncCallMultipleReturn(func);
        }
    }

    return ast;
}
