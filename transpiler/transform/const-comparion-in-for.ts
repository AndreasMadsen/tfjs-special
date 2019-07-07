
import { FileAST, Node, For, ID, BinaryOp, Compound } from '../ast';
import { makeStaticFor, convertBlockToCompound, convertCondToIfBreak } from './_convert-to-for';

export function constComparisonInFor(ast: FileAST): FileAST {
    const names = ['i', 'j', 'k', 'a', 'b', 'c'];

    function getNextName(): string {
        if (names.length === 0) {
            throw new Error('not enogth predefined names');
        }
        return names.shift();
    }

    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof For &&
                child.cond instanceof BinaryOp &&
                child.cond.left instanceof ID &&
                child.cond.right instanceof ID) {

                const forContent = convertBlockToCompound(child.stmt);
                forContent.block_items.unshift(
                    convertCondToIfBreak(child.cond)
                );
                forContent.block_items.push(child.next);

                const staticforLoop = makeStaticFor(
                    `for_${getNextName()}`, 1000, forContent
                ) as Node as T;

                return new Compound({
                    _nodetype: 'Compound',
                    coord: 'transfrom/const-comparison-in-for.ts',
                    block_items: [
                        child.init,
                        staticforLoop
                    ]
                }) as Node as T;
            } else {
                return child.transformChildren(transform);
            }
        }
    );
}
