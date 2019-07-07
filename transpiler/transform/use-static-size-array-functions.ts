import { FileAST, Node, Decl, ArrayDecl, InitList, FuncCall, FuncDecl, ID, Compound, DeclInterface } from '../ast';

const arrayFunctions = new Set(['chbevlf', 'polevlf', 'p1evlf']);

function createArrayFuncDecl(coord: string, name: string,
                             size: number): DeclInterface {
    return {
        '_nodetype': 'Decl',
        'bitsize': null,
        'coord': coord,
        'funcspec': [],
        'init': null,
        'name': `${name}_${size}`,
        'quals': [],
        'storage': [],
        'type': {
            '_nodetype': 'FuncDecl',
            'args': {
                '_nodetype': 'ParamList',
                'coord': coord,
                'params': [
                    {
                        '_nodetype': 'Decl',
                        'bitsize': null,
                        'coord': coord,
                        'funcspec': [],
                        'init': null,
                        'name': 'x',
                        'quals': [],
                        'storage': [],
                        'type': {
                            '_nodetype': 'TypeDecl',
                            'coord': coord,
                            'declname': 'x',
                            'quals': [],
                            'type': {
                                '_nodetype': 'IdentifierType',
                                'coord': coord,
                                'names': [
                                    'float'
                                ]
                            }
                        }
                    },
                    {
                        '_nodetype': 'Decl',
                        'bitsize': null,
                        'coord': coord,
                        'funcspec': [],
                        'init': null,
                        'name': 'coef',
                        'quals': [],
                        'storage': [],
                        'type': {
                            '_nodetype': 'ArrayDecl',
                            'coord': coord,
                            'dim': {
                                '_nodetype': 'Constant',
                                'coord': coord,
                                'type': 'int',
                                'value': `${size}`
                            },
                            'dim_quals': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': coord,
                                'declname': 'coef',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': coord,
                                    'names': [
                                        'float'
                                    ]
                                }
                            }
                        }
                    },
                    {
                        '_nodetype': 'Decl',
                        'bitsize': null,
                        'coord': coord,
                        'funcspec': [],
                        'init': null,
                        'name': 'N',
                        'quals': [],
                        'storage': [],
                        'type': {
                            '_nodetype': 'TypeDecl',
                            'coord': coord,
                            'declname': 'N',
                            'quals': [],
                            'type': {
                                '_nodetype': 'IdentifierType',
                                'coord': coord,
                                'names': [
                                    'int'
                                ]
                            }
                        }
                    }
                ]
            },
            'coord': coord,
            'type': {
                '_nodetype': 'TypeDecl',
                'coord': coord,
                'declname': `${name}_${size}`,
                'quals': [],
                'type': {
                    '_nodetype': 'IdentifierType',
                    'coord': coord,
                    'names': [
                        'float'
                    ]
                }
            }
        }
    };
}

export function useStaticSizeArrayFunctions(ast: FileAST): FileAST {
    // Make a dictionary of all static const arrays, mapping the
    // name to its length.
    const constArrays = new Map<string, number>();
    for (const decl of ast.ext) {
        if (decl instanceof Decl &&
            decl.init instanceof InitList &&
            decl.type instanceof ArrayDecl) {
            constArrays.set(decl.name, decl.init.exprs.length);
        }
    }

    // Rename array function calls to the format fn_N(x, array[N], n)
    const usedArrayFunctionCalls = new Map<string, Set<number>>([
        ['chbevlf', new Set()],
        ['polevlf', new Set()],
        ['p1evlf', new Set()]
    ]);
    ast.transformChildren(function transform<T extends Node>(child: T): T {
        if (child instanceof FuncCall && arrayFunctions.has(child.name.name)) {
            const arrayReference = child.args.exprs[1];
            if (arrayReference instanceof ID) {
                const arraySize = constArrays.get(arrayReference.name);
                usedArrayFunctionCalls.get(child.name.name).add(arraySize);
                return new FuncCall({
                    _nodetype: 'FuncCall',
                    coord: child.coord,
                    name: {
                        _nodetype: 'ID',
                        coord: child.name.coord,
                        name: `${child.name.name}_${arraySize}`
                    },
                    args: child.args
                }) as Node as T;
            } else {
                throw new Error('unreachable');
            }
        } else {
            child.transformChildren(transform);
        }

        return child;
    });

    // Expand proto header with static sized functions
    ast.transformChildren(function transform<T extends Node>(child: T): T {
        if (child instanceof Decl &&
            child.type instanceof FuncDecl &&
            arrayFunctions.has(child.name)) {
            return new Compound({
                '_nodetype': 'Compound',
                'coord': child.coord,
                'block_items': Array.from(
                        usedArrayFunctionCalls.get(child.name)
                    ).map(function makeFuncDecl(size: number): DeclInterface {
                        return createArrayFuncDecl(
                            child.coord, child.name, size
                        );
                    }
                )
            }) as Node as T;
        }

        return child;
    });

    return ast;
}
