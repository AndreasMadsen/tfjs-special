
import { FileAST, Node, For, Assignment, Decl, ID, Constant } from '../ast';

export function declareForInitialization(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof For &&
                child.init instanceof Assignment &&
                child.init.lvalue instanceof ID &&
                child.init.rvalue instanceof Constant) {
                child.init = new Decl({
                    _nodetype: 'Decl',
                    coord: 'transform/declare-for-initialization.ts',
                    bitsize: null,
                    funcspec: [],
                    init: child.init.rvalue,
                    name: child.init.lvalue.name,
                    quals: [],
                    storage: [],
                    type: {
                        _nodetype: 'TypeDecl',
                        coord: 'transform/declare-for-initialization.ts',
                        declname: child.init.lvalue.name,
                        quals: [],
                        type: {
                            _nodetype: 'IdentifierType',
                            coord: 'transform/declare-for-initialization.ts',
                            names: ['int']
                        }
                    }
                });
            }

            return child.transformChildren(transform);
        }
    );
}
