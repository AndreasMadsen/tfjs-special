
import { FileAST, Node, Label, Goto, Compound, FuncDef, Case } from '../ast';
import { makeStaticFor } from './_make-static-for';

function hasGoto(func: FuncDef): boolean {
    let gotoFound = false;

    func.transformChildren(function search<T extends Node>(child: T): T {
        if (child instanceof Goto) {
            gotoFound = true;
        }

        if (!gotoFound) {
            child.transformChildren(search);
        }

        return child;
    });

    return gotoFound;
}

function insertWrappingLoopedSwtich(func: FuncDef) {
    func.body = new Compound({
        _nodetype: 'Compound',
        coord: 'transform/eliminate-goto.ts',
        block_items: [makeStaticFor(
            'goto_key', 100, {
                _nodetype: 'Compound',
                coord: 'transform/goto-to-swtich.ts',
                block_items: [{
                    _nodetype: 'Decl',
                    coord: 'transform/while-to-for.ts',
                    bitsize: null,
                    funcspec: [],
                    init: {
                        _nodetype: 'Constant',
                        coord: 'transform/while-to-for.ts',
                        value: '0',
                        type: 'int'
                    },
                    name: 'goto_value',
                    quals: [],
                    storage: [],
                    type: {
                        _nodetype: 'TypeDecl',
                        coord: 'transform/while-to-for.ts',
                        declname: 'goto_value',
                        quals: [],
                        type: {
                            _nodetype: 'IdentifierType',
                            coord: 'transform/while-to-for.ts',
                            names: ['int']
                        }
                    }
                }, {
                    _nodetype: 'Switch',
                    coord: 'transform/goto-to-swtich.ts',
                    cond: {
                        _nodetype: 'ID',
                        coord: 'transform/goto-to-swtich.ts',
                        name: 'goto_key'
                    },
                    stmt: {
                        _nodetype: 'Compound',
                        coord: 'transform/goto-to-swtich.ts',
                        block_items: [{
                            _nodetype: 'Case',
                            coord: 'transform/goto-to-swtich.ts',
                            expr: {
                                _nodetype: 'Constant',
                                coord: 'transform/goto-to-swtich.ts',
                                value: '0',
                                type: 'int'
                            },
                            stmts: [{
                                _nodetype: 'EmptyStatement',
                                coord: 'transform/goto-to-swtich.ts'
                            }]
                        }, ...func.body.block_items]
                    }
                }]
            }
        )]
    });
}

function replaceLabelsWithCase(func: FuncDef): Map<string, number> {
    const label2case = new Map<string, number>();

    func.transformChildren(function transform<T extends Node>(child: T): T {
        if (child instanceof Label) {
            label2case.set(child.name, label2case.size + 1);

            return new Case({
                _nodetype: 'Case',
                coord: 'transform/goto-to-swtich.ts',
                expr: {
                    _nodetype: 'Constant',
                    coord: 'transform/goto-to-swtich.ts',
                    value: label2case.get(child.name).toString(),
                    type: 'int'
                },
                stmts: [child.stmt]
            }) as Node as T;
        }

        return child.transformChildren(transform);
    });

    return label2case;
}

function replaceGotoWithContine(func: FuncDef,
                                label2case: Map<string, number>) {
    func.transformChildren(function transform<T extends Node>(child: T): T {
        if (child instanceof Goto) {
            return new Compound({
                _nodetype: 'Compound',
                coord: 'transform/goto-to-swtich.ts',
                block_items: [{
                    _nodetype: 'Assignment',
                    coord: 'transform/goto-to-swtich.ts',
                    lvalue: {
                        _nodetype: 'ID',
                        coord: 'transform/goto-to-swtich.ts',
                        name: 'goto_value'
                    },
                    rvalue: {
                        _nodetype: 'Constant',
                        coord: 'transform/goto-to-swtich.ts',
                        value: label2case.get(child.name),
                        type: 'int'
                    }
                }, { // Does not work if in another loop :/
                    _nodetype: 'Continue',
                    coord: 'transform/goto-to-swtich.ts'
                }]
            }) as Node as T;
        }

        return child.transformChildren(transform);
    });
}

export function gotoToSwitch(ast: FileAST): FileAST {
    // Replace labels with
    for (const rootDecl of ast.ext) {
        if (rootDecl instanceof FuncDef && hasGoto(rootDecl)) {
            insertWrappingLoopedSwtich(rootDecl);
            const label2case = replaceLabelsWithCase(rootDecl);
            replaceGotoWithContine(rootDecl, label2case);
        }
    }

    return ast;
}
