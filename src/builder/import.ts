
import { ExportableScript } from './exportable';

import { importAstFromJson, FileAST } from './ast';
import { castToCall } from './transform/cast-to-call';
import { editMtherr } from './transform/edit-mtherr';
import { eliminateGoto } from './transform/eliminate-goto';
import { explicitTypeConversion } from './transform/explicit-type-conversion';
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

    ast = upgradeFunctionDefs(ast);
    ast = useBuiltinMath(ast);
    ast = castToCall(ast);

    ast = editMtherr(ast);
    ast = useStaticSizeArrayFunctions(ast);
    ast = explicitTypeConversion(ast);
    ast = renameStatic(basename, ast);
    ast = ternaryToAbs(ast);
    ast = whileToFor(ast);

    ast = eliminateGoto(ast);

    return ast;
}

export function importExportableFromSourceCode(
    basename: string, source: string
): ExportableScript {
    return new ExportableScript(importAstFromSourceCode(basename, source));
}
