
import { ExportableScript } from './exportable';

import { importAstFromJson, FileAST } from './ast';
import { binaryToOddCheck } from './transform/binary-to-odd-check';
import { castToCall } from './transform/cast-to-call';
import { constComparisonInFor } from './transform/const-comparion-in-for';
import { declareForInitialization } from './transform/declare-for-initialization';
import { editMtherr } from './transform/edit-mtherr';
import { eliminateGoto } from './transform/eliminate-goto';
import { explicitTypeConversion } from './transform/explicit-type-conversion';
import { removeFloatSuffix } from './transform/remove-float-suffix';
import { removeStaticVariableStroage } from './transform/remove-static-variable-storage';
import { renameStatic } from './transform/rename-static';
import { ternaryToAbs } from './transform/ternary-to-abs';
import { unrollRecursiveCall } from './transform/unroll-recursive-call';
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

    ast = constComparisonInFor(ast);
    ast = declareForInitialization(ast);
    ast = binaryToOddCheck(ast);
    ast = editMtherr(ast);
    ast = useStaticSizeArrayFunctions(ast);
    ast = explicitTypeConversion(ast);
    ast = removeFloatSuffix(ast);
    ast = removeStaticVariableStroage(ast);
    ast = renameStatic(basename, ast);
    ast = ternaryToAbs(ast);
    ast = unrollRecursiveCall(basename, ast);
    ast = whileToFor(ast);

    ast = eliminateGoto(ast);

    return ast;
}

export function importExportableFromSourceCode(
    basename: string, source: string
): ExportableScript {
    return new ExportableScript(importAstFromSourceCode(basename, source));
}
