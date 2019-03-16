
import { ExportableScript } from './exportable';

import { importAstFromJson } from './ast';
import { arrayPointerToIndex } from './transform/array-pointer-to-index';
import { castToCall } from './transform/cast-to-call';
import { eliminateGoto } from './transform/eliminate-goto';
import { removeMtherr } from './transform/remove-mtherr';
import { renameStaticConstants } from './transform/rename-static-constants';
import { ternaryToAbs } from './transform/ternary-to-abs';
import { upgradeFunctionDefs } from './transform/upgrade-function-defs';
import { useBuiltinMath } from './transform/use-builtin-math';
import { whileToFor } from './transform/while-to-for';

export function importExportableFromSourceCode(
    basename: string, source: string
): ExportableScript {
    let ast = importAstFromJson(JSON.parse(source));

    ast = arrayPointerToIndex(ast);
    ast = useBuiltinMath(ast);
    ast = castToCall(ast);
    ast = removeMtherr(ast);
    ast = renameStaticConstants(basename, ast);
    ast = ternaryToAbs(ast);
    ast = upgradeFunctionDefs(ast);
    ast = whileToFor(ast);
    ast = eliminateGoto(ast);

    return new ExportableScript(ast);
}
