
import { FileAST, Node, Label, Goto, Compound, Return, CompoundItem, Block, If, FuncDef } from '../ast';

function hasReturn(node: Block): boolean {
    if (node instanceof Return) {
        return true;
    }

    let returnFound = false;

    node.transformChildren(function search<T extends Node>(child: T): T {
        if (child instanceof Return) {
            returnFound = true;
            return child;
        }

        if (child instanceof If) {
            if (child.iffalse &&
                hasReturn(child.iffalse) && hasReturn(child.iftrue)) {
                returnFound = true;
            }
            return child;
        }

        if (!returnFound) {
            child.transformChildren(search);
        }
        return child;
    });

    return returnFound;
}

function getLabelBlock(child: Label, parent: Compound) {
    const labelIndex = parent.block_items.indexOf(child);
    if (labelIndex === -1) {
        throw new Error('unreachable');
    }

    // Get the label block
    const startIndex = labelIndex + 1;
    const labelBlock = [child.stmt];
    const parentBlock = parent.block_items.slice(startIndex);

    while (!hasReturn(labelBlock[labelBlock.length - 1])
           && parentBlock.length > 0) {
        const siblingBlock = parentBlock.shift();
        // An sibling label will not be removed from this labelBlock
        // by this transform, as the label is about to be push to
        // labelBlock.
        // Deeper labels will be removed by mutation, of this
        // transform, so there is no need to go futher.
        if (siblingBlock instanceof Label) {
            labelBlock.push(siblingBlock.stmt);
        } else {
            labelBlock.push(siblingBlock);
        }
    }

    return labelBlock;
}

function eliminateGotoFromFunction(func: FuncDef) {
    // needs to be per func
    const labels = new Map<string, CompoundItem[]>();

    // Find labels, get the following block, remove the label
    func.transformChildren(
        function transform<T extends Node, TT extends Node>(
            child: T, parent: TT
        ): T {
            if (child instanceof Label && parent instanceof Compound) {
                // Save the label block in index
                labels.set(child.name, getLabelBlock(child, parent));

                // Remove the label
                return child.stmt.transformChildren(transform) as Node as T;
            } else {
                return child.transformChildren(transform);
            }
        }
    );

    // replace
    func.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Goto) {
                if (labels.has(child.name)) {
                    const compund = new Compound({
                        _nodetype: 'Compound',
                        coord: 'transfrom/eliminate-goto.ts',
                        block_items: labels.get(child.name)
                    });

                    return compund.transformChildren(transform) as Node as T;
                } else {
                    throw new Error('invalid goto');
                }
            }

            return child.transformChildren(transform);
        }
    );
}

export function eliminateGoto(ast: FileAST): FileAST {
    // Replace labels with
    for (const rootDecl of ast.ext) {
        if (rootDecl instanceof FuncDef) {
            eliminateGotoFromFunction(rootDecl);
        }
    }

    return ast;
}
