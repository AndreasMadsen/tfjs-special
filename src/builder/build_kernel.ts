
import * as fs from 'fs';
import { importAstFromJson } from './ast';
import { useBuiltinMath } from './transform/use-builtin-math';
import { removeMtherr } from './transform/remove-mtherr';
import { ternaryToAbs } from './transform/ternary-to-abs';
import { upgradeFunctionDefs } from './transform/upgrade-function-defs';
import { whileToFor } from './transform/while-to-for';

//const inputFile = process.argv[2];
//const outputFile = process.argv[3];

for (const filename of process.argv.slice(2)) {
    const kernelSource = fs.readFileSync(filename, 'utf-8');
    let ast = importAstFromJson(JSON.parse(kernelSource));

    ast = useBuiltinMath(ast);
    ast = removeMtherr(ast);
    ast = ternaryToAbs(ast);
    ast = upgradeFunctionDefs(ast);
    ast = whileToFor(ast);

    fs.writeFileSync(filename.slice(0, -5) + '.export.c', ast.exportAsCode());
}

//fs.writeFileSync(outputFile, source.exportAsScript());
