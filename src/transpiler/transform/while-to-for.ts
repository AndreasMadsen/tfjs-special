
import {
    FileAST, Node,
    While, DoWhile,
    Compound, CompoundInterface, Block, Expression, IfInterface,
 } from '../ast';
import { makeStaticFor } from './_make-static-for';

function convertBlockToCompound(stmt: Block): CompoundInterface {
    // convert CompoundItem to Compound
    if (stmt instanceof Compound) {
        return stmt;
    }

    return {
        _nodetype: 'Compound',
        coord: 'transform/while-to-for.ts',
        block_items: [stmt]
    };
}

function convertCondToIfBreak(cond: Expression): IfInterface {
    return {
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
    };
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
