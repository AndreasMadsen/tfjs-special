
import { ID, FileAST, FuncDef, Decl, FuncDecl } from '../ast';

export function upgradeFunctionDefs(ast: FileAST): FileAST {
    return ast.transformChildren(function transform(child) {
        if (child instanceof FuncDef && child.param_decls !== null &&
            child.decl.type instanceof FuncDecl) {

            const upgradeDeclIndex = new Map(child.param_decls.map(
                (decl: Decl): [string, Decl] => [decl.name, decl]
            ));

            child.decl.type.args.params = child.decl.type.args.params.map(
                (param: ID): Decl => upgradeDeclIndex.get(param.name)
            );

            child.param_decls = null;
        }

        return child;
    });
}
