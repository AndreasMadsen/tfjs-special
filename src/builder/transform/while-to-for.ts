
import {
    FileAST, Node,
    While, DoWhile, For,
    Compound, Block, Expression, If,
    Decl, ID
 } from '../ast';

function convertBlockToCompound(stmt: Block): Compound {
    // convert CompoundItem to Compound
    if (stmt instanceof Compound) {
        return stmt;
    }

    return new Compound({
        _nodetype: 'Compound',
        coord: 'transform/while-to-for.ts',
        block_items: [stmt]
    });
}

function convertCondToIfBreak(cond: Expression): If {
    return new If({
        _nodetype: 'If',
        coord: 'transform/while-to-for.ts',
        cond: {
            _nodetype: 'UnaryOp',
            coord: 'transform/while-to-for.ts',
            expr: cond,
            op: '!'
        },
        iffalse: null,
        iftrue: {
            _nodetype: 'Break',
            coord: 'transform/while-to-for.ts'
        }
    });
}

function makeStaticFor(incrementerName: string, maxIter: number,
                       compound: Compound): For {
    const incrementer = new ID({
        _nodetype: 'ID',
        coord: 'transform/while-to-for.ts',
        name: incrementerName
    });

    const initDecl = new Decl({
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
        name: incrementerName,
        quals: [],
        storage: [],
        type: {
            _nodetype: 'TypeDecl',
            coord: 'transform/while-to-for.ts',
            declname: incrementerName,
            quals: [],
            type: {
                _nodetype: 'IdentifierType',
                coord: 'transform/while-to-for.ts',
                names: ['int']
            }
        }
    });

    return new For({
        _nodetype: 'For',
        coord: 'transform/while-to-for.ts',
        init: initDecl,
        cond: {
            _nodetype: 'BinaryOp',
            coord: 'transform/while-to-for.ts',
            left: incrementer,
            op: '<',
            right: {
                _nodetype: 'Constant',
                coord: 'transform/while-to-for.ts',
                value: maxIter.toString(),
                type: 'int'
            }
        },
        next: {
            _nodetype: 'UnaryOp',
            coord: 'transform/while-to-for.ts',
            expr: incrementer,
            op: 'p++'
        },
        stmt: compound
    });
}

export function whileToFor(ast: FileAST): FileAST {
    const names = ['i', 'j', 'k', 'a', 'b', 'c'];

    function getNextName(): string {
        if (names.length === 0) {
            throw new Error('not enogth predefined names');
        }
        return names.shift();
    }

    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof While) {
                const compound = convertBlockToCompound(child.stmt);
                compound.block_items.unshift(convertCondToIfBreak(child.cond));

                return makeStaticFor(
                    `while_${getNextName()}`, 1000, compound
                ) as Node as T;
            }

            if (child instanceof DoWhile) {
                const compound = convertBlockToCompound(child.stmt);
                compound.block_items.push(convertCondToIfBreak(child.cond));

                return makeStaticFor(
                    `dowhile_${getNextName()}`, 1000, compound
                ).transformChildren(transform) as Node as T;
            }

            child.transformChildren(transform);
            return child;
        }
    );
}
