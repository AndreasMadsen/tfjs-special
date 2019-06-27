
import { FileAST, Decl, TypeDecl, ID, Node } from '../ast';

function removeElement<T>(array: T[], element: T): T[] {
    const index = array.indexOf(element);
    if (index === -1) {
        return array;
    }
    return [...array.slice(0, index), ...array.slice(index + 2)];
}

export function renameStatic(basename: string, ast: FileAST): FileAST {
    const staticRenames = new Map();
    for (const child of ast.ext) {
        if (child instanceof Decl &&
            child.storage.indexOf('static') !== -1) {
                staticRenames.set(child.name, `${basename}_${child.name}`);
        }
    }

    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Decl) {
                if (staticRenames.has(child.name)) {
                    child = new Decl({
                        _nodetype: 'Decl',
                        coord: child.coord,
                        bitsize: child.bitsize,
                        funcspec: child.funcspec,
                        init: child.init,
                        name: staticRenames.get(child.name),
                        quals: child.quals,
                        storage: removeElement(child.storage, 'static'),
                        type: child.type
                    }) as Node as T;
                }
            } else if (child instanceof TypeDecl) {
                if (staticRenames.has(child.declname)) {
                    child = new TypeDecl({
                        _nodetype: 'TypeDecl',
                        coord: child.coord,
                        declname: staticRenames.get(child.declname),
                        quals: child.quals,
                        type: child.type
                    }) as Node as T;
                }
            } else if (child instanceof ID) {
                if (staticRenames.has(child.name)) {
                    child = new ID({
                        _nodetype: 'ID',
                        coord: child.coord,
                        name: staticRenames.get(child.name),
                    }) as Node as T;
                }
            }

            child.transformChildren(transform);
            return child;
        }
    );
}
