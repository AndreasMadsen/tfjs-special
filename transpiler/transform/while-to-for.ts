
import { FileAST, Node, While, DoWhile } from '../ast';
import { makeStaticFor, convertBlockToCompound, convertCondToIfBreak } from './_convert-to-for';

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
