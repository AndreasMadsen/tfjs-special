
import { ExportableScript } from './exportable';

import { importAstFromJson, FileAST } from './ast';
//import { arrayPointerToIndex } from './transform/array-pointer-to-index';
import { castToCall } from './transform/cast-to-call';
import { eliminateGoto } from './transform/eliminate-goto';
import { removeMtherr } from './transform/remove-mtherr';
import { renameStatic } from './transform/rename-static';
import { ternaryToAbs } from './transform/ternary-to-abs';
import { upgradeFunctionDefs } from './transform/upgrade-function-defs';
import { useBuiltinMath } from './transform/use-builtin-math';
import { useStaticSizeArrayFunctions } from './transform/use-static-size-array-functions';
import { whileToFor } from './transform/while-to-for';

export function importAstFromSourceCode(
    basename: string, source: string
): FileAST {
    if (basename === 'jvf') {
        return new FileAST({
            _nodetype: 'FileAST',
            coord: 'import.ts',
            ext: []
        });
    }

    let ast = importAstFromJson(JSON.parse(source));

    //ast = arrayPointerToIndex(ast);
    ast = useStaticSizeArrayFunctions(ast);
    ast = useBuiltinMath(ast);
    ast = castToCall(ast);
    ast = removeMtherr(ast);
    ast = renameStatic(basename, ast);
    ast = ternaryToAbs(ast);
    ast = upgradeFunctionDefs(ast);
    ast = whileToFor(ast);
    ast = eliminateGoto(ast);

    return ast;
}

export function importExportableFromSourceCode(
    basename: string, source: string
): ExportableScript {
    return new ExportableScript(importAstFromSourceCode(basename, source));
}
