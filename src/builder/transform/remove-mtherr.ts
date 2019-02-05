
import { FuncCall, FileAST, Constant, Decl } from '../ast';

export function removeMtherr(ast: FileAST): FileAST {
    ast.ext = ast.ext.filter(function filter(child): boolean {
        if (child instanceof Decl) {
            return (child.name !== 'merror');
        } else {
            return true;
        }
    });

    return ast.transformChildren(function transform(child) {
        if (child instanceof FuncCall) {
            if (child.name.name === 'mtherr') {
                child.name.name = 'void';
                child.args.exprs = [new Constant({
                    _nodetype: 'Constant',
                    coord: 'transform/remove-mtherr.ts',
                    type: 'int',
                    value: '0'
                })];
            }
        } else {
            child.transformChildren(transform);
        }

        return child;
    });
}
