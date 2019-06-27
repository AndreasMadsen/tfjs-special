
import { FuncCall, FileAST, Decl } from '../ast';

export function editMtherr(ast: FileAST): FileAST {
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
                child.args.exprs = child.args.exprs.slice(1);
            }
        } else {
            child.transformChildren(transform);
        }

        return child;
    });
}
