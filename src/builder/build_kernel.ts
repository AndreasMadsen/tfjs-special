
import * as fs from 'fs';
import { importAstFromJson } from './ast';
import { arrayPointerToIndex } from './transform/array-pointer-to-index';
import { castToCall } from './transform/cast-to-call';
import { eliminateGoto } from './transform/eliminate-goto';
import { removeMtherr } from './transform/remove-mtherr';
import { ternaryToAbs } from './transform/ternary-to-abs';
import { upgradeFunctionDefs } from './transform/upgrade-function-defs';
import { useBuiltinMath } from './transform/use-builtin-math';
import { whileToFor } from './transform/while-to-for';

//const inputFile = process.argv[2];
//const outputFile = process.argv[3];

for (const filename of process.argv.slice(2)) {
    const exportFilename = filename.slice(0, -5) + '.export.c';
    const kernelSource = fs.readFileSync(filename, 'utf-8');

    // contains recursion
    if (filename === 'cephes/jvf.json') {
        fs.writeFileSync(exportFilename, '');
        continue;
    }

    console.log(filename);

    let ast = importAstFromJson(JSON.parse(kernelSource));

    ast = arrayPointerToIndex(ast);
    ast = useBuiltinMath(ast);
    ast = castToCall(ast);
    ast = removeMtherr(ast);
    ast = ternaryToAbs(ast);
    ast = upgradeFunctionDefs(ast);
    ast = whileToFor(ast);
    ast = eliminateGoto(ast);

    fs.writeFileSync(exportFilename, ast.exportAsCode());
}

//fs.writeFileSync(outputFile, source.exportAsScript());
