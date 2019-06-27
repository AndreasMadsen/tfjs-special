import { FileAST, Node, Decl, Expression, Compound,
         FuncDecl, ParamList, FuncDef, AllDecl, IdentifierType,
         TernaryOp, BinaryOp, UnaryOp,
         ID, Constant, FuncCall, If, Return, Assignment } from '../ast';

declare type VariableMap = Map<string, string>;

function getTypeName(decl: Decl): string {
    let type: AllDecl | IdentifierType = decl.type;
    while (!(type instanceof IdentifierType)) {
        type = type.type;
    }

    return type.names[0];
}

function addGlobalVariableDeclarations(
    content: Node[], variables: VariableMap
) {
    for (const node of content) {
        let decl = node;
        if (node instanceof FuncDef) {
            decl = node.decl;
        }
        if (decl instanceof Decl) {
            variables.set(decl.name, getTypeName(decl));
        }
    }
}

function addLocalVariableDeclarations(
    content: Compound, variables: VariableMap
) {
    content.transformChildren(
        function scan<T extends Node>(child: T): T {
            if (child instanceof Decl) {
                variables.set(child.name, getTypeName(child));
            }

            return child.transformChildren(scan);
        }
    );
}

function addArgumentDeclarations(func: FuncDef, variables: VariableMap) {
    if ((func.decl.type instanceof FuncDecl &&
         func.decl.type.args instanceof ParamList)) {
        const argumentsDecls = func.decl.type.args.params;
        for (const decl of argumentsDecls) {
            if (!(decl instanceof Decl)) {
                continue;
            }

            let type: AllDecl | IdentifierType = decl.type;
            while (!(type instanceof IdentifierType)) {
                type = type.type;
            }

            variables.set(decl.name, type.names[0]);
        }
    }
}

function makeCast(typeName: string, expression: Expression): FuncCall {
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
            exprs: [expression]
        }
    });
}

function transformFunction(func: FuncDef, variables: Map<string, string>) {
    const typeInference = new WeakMap<Node, string>();
    const booleanOps = new Set(['==', '!=', '<', '>', '<=', '>=', '&&', '||']);
    const builtinFuncs = new Set([
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'pow', 'exp', 'exp2',
        'log', 'log2', 'sqrt', 'floor', 'ceil'
    ]);

    // walk though function and infer types for intermediate results
    func.body.transformChildren(
        function transform<T extends Node>(child: T): T {
            child.transformChildren(transform);

            if (child instanceof Constant) {
                typeInference.set(child, child.type);
            } else if (child instanceof ID) {
                typeInference.set(child, variables.get(child.name));
            } else if (child instanceof FuncCall) {
                // Buildin functions return the same type as their input
                if (builtinFuncs.has(child.name.name)) {
                    typeInference.set(child,
                                      typeInference.get(child.args.exprs[0]));
                }
                // Non-builtin functions don't have overloads, and thus we can
                // just check their return type.
                else {
                    typeInference.set(child, variables.get(child.name.name));
                }
            } else if (child instanceof UnaryOp) {
                if (child.op === '!') {
                    typeInference.set(child, 'bool');
                } else {
                    typeInference.set(child, typeInference.get(child.expr));
                }
            } else if (child instanceof If) {
                if (typeInference.get(child.cond) !== 'bool') {
                    child.cond = makeCast('bool', child.cond);
                    typeInference.set(child.cond, 'bool');
                }
            } else if (child instanceof Return) {
                const funcType = variables.get(func.decl.name);
                if (funcType !== typeInference.get(child.expr)) {
                    child.expr = makeCast(funcType, child.expr);
                }
            } else if (child instanceof Assignment) {
                if (child.lvalue instanceof ID) {
                    const targetType = variables.get(child.lvalue.name);
                    if (targetType !== typeInference.get(child.rvalue)) {
                        child.rvalue = makeCast(targetType, child.rvalue);
                        typeInference.set(child.rvalue, targetType);
                    }
                }
            } else if (child instanceof BinaryOp) {
                const leftType = typeInference.get(child.left);
                const rightType = typeInference.get(child.right);

                if (leftType === 'float' && rightType !== 'float') {
                    child.right = makeCast('float', child.right);
                    typeInference.set(child.right, 'float');
                } else if (leftType !== 'float' && rightType === 'float') {
                    child.left = makeCast('float', child.left);
                    typeInference.set(child.left, 'float');
                } else if (leftType === 'int' && rightType !== 'int') {
                    child.right = makeCast('int', child.right);
                    typeInference.set(child.right, 'int');
                } else if (leftType !== 'int' && rightType === 'int') {
                    child.left = makeCast('int', child.left);
                    typeInference.set(child.left, 'int');
                }

                // When reaching this, this types of left and right should
                // now be equal.
                if (booleanOps.has(child.op)) {
                    typeInference.set(child, 'bool');
                } else {
                    typeInference.set(child, typeInference.get(child.left));
                }
            } else if (child instanceof TernaryOp) {
                const iftrueType = typeInference.get(child.iftrue);
                const iffalseType = typeInference.get(child.iffalse);

                if (iftrueType === 'float' && iffalseType !== 'float') {
                    child.iffalse = makeCast('float', child.iffalse);
                } else if (iftrueType !== 'float' && iffalseType === 'float') {
                    child.iftrue = makeCast('float', child.iftrue);
                } else if (iftrueType === 'int' && iffalseType !== 'int') {
                    child.iffalse = makeCast('int', child.iffalse);
                } else if (iftrueType !== 'int' && iffalseType === 'int') {
                    child.iftrue = makeCast('int', child.iftrue);
                }

                // When reaching this, this types of iftrue and iffalse
                // should now be equal.
                typeInference.set(child, typeInference.get(child.iftrue));
            }

            return child;
        }
    );

    // Add explicit conversion
}

function mergeGlobalAndLocal<T>(
        globalVariables: Map<T, T>,
        functionVariables: Map<T, T>): Map<T, T> {
    const variables = new Map(globalVariables.entries());
    for (const [key, value] of functionVariables) {
        variables.set(key, value);
    }
    return variables;
}

export function explicitTypeConversion(ast: FileAST): FileAST {
    const globalVariables = new Map<string, string>();
    const functionVariables = new Map<string, Map<string, string>>();

    addGlobalVariableDeclarations(ast.ext, globalVariables);

    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            const variables = new Map<string, string>();
            functionVariables.set(func.decl.name, variables);
            addArgumentDeclarations(func, variables);
            addLocalVariableDeclarations(func.body, variables);
        }
    }

    for (const func of ast.ext) {
        if (func instanceof FuncDef) {
            transformFunction(
                func,
                mergeGlobalAndLocal(
                    globalVariables,
                    functionVariables.get(func.decl.name)
                )
            );
        }
    }

    return ast;
}
