
import { FileAST, FuncDef, Node, FuncCall, Constant, Decl, FuncDecl } from '../ast';

function dublicateFunction(func: FuncDef, newName: string): FuncDef {
    if (!(func.decl.type instanceof FuncDecl)) {
        throw new Error('unexpected declaration type');
    }

    return new FuncDef({
        _nodetype: 'FuncDef',
        coord: 'transform/unroll-recursive-call.js',
        decl: {
            _nodetype: 'Decl',
            coord: 'transform/unroll-recursive-call.js',
            bitsize: func.decl.bitsize,
            funcspec: func.decl.funcspec,
            init: func.decl.init,
            name: newName,
            quals: func.decl.quals,
            storage: func.decl.storage,
            type: {
                _nodetype: 'FuncDecl',
                coord: 'transform/unroll-recursive-call.js',
                args: func.decl.type.args,
                type: {
                    _nodetype: 'TypeDecl',
                    coord: 'transform/unroll-recursive-call.js',
                    declname: newName,
                    quals: func.decl.type.type.quals,
                    type: func.decl.type.type.type
                }
            }
        },
        param_decls: func.param_decls,
        body: func.body
    });
}

function renameFunctionCalls(
    func: FuncDef, fromName: string, toName: string
): void {
    func.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof FuncCall && child.name.name === fromName) {
                child = new FuncCall({
                    _nodetype: 'FuncCall',
                    coord: 'transform/unroll-recursive-call.js',
                    name: {
                        _nodetype: 'ID',
                        coord: 'transform/unroll-recursive-call.js',
                        name: toName
                    },
                    args: child.args
                }) as Node as T;
            }
            return child.transformChildren(transform);
        }
    );
}

function replaceFunctionCallWithNAN(func: FuncDef, name: string): FuncDef {
    return func.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof FuncCall && child.name.name === name) {
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
}

export function unrollRecursiveCall(basename: string, ast: FileAST): FileAST {
    const insertFunctions: FuncDef[] = [];
    const functionCalls = new Map<
        string, { func: FuncDef, calls: Set<string> }
    >();

    // Create a basic graph (name -> calls[]) of all calls
    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            const name = func.decl.name;
            const calls = new Set<string>();
            func.transformChildren(
                function scan<T extends Node>(child: T): T {
                    if (child instanceof FuncCall) {
                        calls.add(child.name.name);
                    }
                    return child.transformChildren(scan);
                }
            );
            functionCalls.set(name, {func, calls});
        }
    }

    // Check for recursive calls and replace recursive
    // calls with NAN accordingly
    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            const name = func.decl.name;
            for (const callName of functionCalls.get(name).calls) {
                // Check for 2-order recursive calls, root -> other -> root
                if (functionCalls.has(callName) &&
                    functionCalls.get(callName).calls.has(name)) {
                    insertFunctions.push(
                        replaceFunctionCallWithNAN(
                            dublicateFunction(
                                functionCalls.get(callName).func,
                                `${name}_recusive_${callName}`),
                            name));
                    renameFunctionCalls(
                        func, callName, `${name}_recusive_${callName}`);
                }
            }
        }
    }

    // Insert additional functions
    for (const func of insertFunctions) {
        ast.ext.push(func);
        ast.ext.unshift(new Decl(func.decl));
    }

    return ast;
}
