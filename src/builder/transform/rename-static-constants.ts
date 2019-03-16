
import { FileAST, Decl, TypeDecl, ID, Node } from '../ast';

export function renameStaticConstants(basename: string, ast: FileAST): FileAST {
    const staticConstants = new Map();
    for (const child of ast.ext) {
        if (child instanceof Decl &&
            child.storage.indexOf('static') !== -1) {
            staticConstants.set(child.name, `${basename}_${child.name}`);
        }
    }

    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Decl) {
                if (staticConstants.has(child.name)) {
                    child = new Decl({
                        _nodetype: 'Decl',
                        coord: child.coord,
                        bitsize: child.bitsize,
                        funcspec: child.funcspec,
                        init: child.init,
                        name: staticConstants.get(child.name),
                        quals: child.quals,
                        storage: child.storage,
                        type: child.type
                    }) as Node as T;
                }
            } else if (child instanceof TypeDecl) {
                if (staticConstants.has(child.declname)) {
                    child = new TypeDecl({
                        _nodetype: 'TypeDecl',
                        coord: child.coord,
                        declname: staticConstants.get(child.declname),
                        quals: child.quals,
                        type: child.type
                    }) as Node as T;
                }
            } else if (child instanceof ID) {
                if (staticConstants.has(child.name)) {
                    child = new ID({
                        _nodetype: 'ID',
                        coord: child.coord,
                        name: staticConstants.get(child.name),
                    }) as Node as T;
                }
            }

            child.transformChildren(transform);
            return child;
        }
    );
}
