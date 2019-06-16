
import { FileAST, Decl, FuncDef, ID, Node, Assignment } from '../ast';

function removeElement<T>(array: T[], element: T): T[] {
    const index = array.indexOf(element);
    if (index === -1) {
        return array;
    }
    return [...array.slice(0, index), ...array.slice(index + 2)];
}

export function removeStaticVariableStroage(ast: FileAST): FileAST {
    for (const child of ast.ext) {
        if (child instanceof FuncDef) {
            const staticVariables = new Set();

            child.transformChildren(
                function transform<T extends Node>(child: T): T {
                    if (child instanceof Decl &&
                        child.storage.indexOf('static') !== -1) {

                        staticVariables.add(child.name);
                        child = new Decl({
                            _nodetype: 'Decl',
                            coord: child.coord,
                            bitsize: child.bitsize,
                            funcspec: child.funcspec,
                            init: child.init,
                            name: child.name,
                            quals: child.quals,
                            storage: removeElement(child.storage, 'static'),
                            type: child.type
                        }) as Node as T;
                    } else if (child instanceof Assignment) {
                        if (child.lvalue instanceof ID &&
                            staticVariables.has(child.lvalue.name)) {
                            throw new Error(
                                `can not remove 'static'` +
                                ` from variable ${child.lvalue.name}`
                            );
                        }
                    }
                    return child.transformChildren(transform);
                }
            );
        }
    }

    return ast;
}
