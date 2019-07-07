
import { FileAST, Node,
         Switch, Case, Break, Default,
         If, IfInterface,
         Expression, CompoundItem } from '../ast';

function covertSwtich(node: Switch): If | Switch {
    let coundNotCovert = false;

    // map conditions to CompoundItem list
    const switchConditions = new Map<
        Expression | Default, CompoundItem[]
    >();

    let currentCondition = null;
    let didBreak = true;
    (function scan(items: CompoundItem[]) {
        for (const item of items) {
            if (item instanceof Case) {
                if (!didBreak) {
                    coundNotCovert = true;
                }

                currentCondition = item.expr;
                switchConditions.set(item.expr, []);
                scan(item.stmts);
            } else if (item instanceof Break) {
                didBreak = true;
            } else if (item instanceof Default) {
                if (!didBreak) {
                    coundNotCovert = true;
                }

                currentCondition = item;
                switchConditions.set(item, []);
                scan(item.stmts);
            } else {
                switchConditions.get(currentCondition).push(item);
            }
        }
    })(node.stmt.block_items);

    // Keep Switch statement if sufficient breaks weren't found
    if (coundNotCovert) {
        return node;
    }

    // Covert Switch to If statements
    let rootIfNode: IfInterface = null;
    let currentIfNode: IfInterface = null;
    let defaultCond = null;
    for (const [swtichCond, statements] of switchConditions) {
        if (swtichCond instanceof Default) {
            defaultCond = swtichCond;
            continue;
        }

        const ifNode: IfInterface = {
            _nodetype: 'If',
            coord: 'transform/switch-to-if-statements.ts',
            cond: {
                _nodetype: 'BinaryOp',
                coord: 'transform/switch-to-if-statements.ts',
                left: node.cond,
                right: swtichCond,
                op: '=='
            },
            iftrue: {
                _nodetype: 'Compound',
                coord: 'transform/switch-to-if-statements.ts',
                block_items: statements
            },
            iffalse: null
        };

        if (rootIfNode === null) {
            rootIfNode = ifNode;
        } else {
            currentIfNode.iffalse = ifNode;
        }
        currentIfNode = ifNode;
    }

    if (defaultCond !== null) {
        currentIfNode.iffalse = {
            _nodetype: 'Compound',
            coord: 'transform/switch-to-if-statements.ts',
            block_items: switchConditions.get(defaultCond)
        };
    }

    // Return the assmebled If statements
    return new If(rootIfNode);
}

export function switchToIfStatements(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Switch) {
                return (
                    covertSwtich(child) as Node as T
                ).transformChildren(transform);
            }

            return child.transformChildren(transform);
        }
    );
}
