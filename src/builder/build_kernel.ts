
import * as fs from 'fs';
import { Node, FileAST } from './ast';
import { useBuiltinMath } from './transform/use-builtin-math';

//const inputFile = process.argv[2];
//const outputFile = process.argv[3];

for (const filename of process.argv.slice(2)) {
    const kernelSource = fs.readFileSync(filename, 'utf-8');
    let ast = new FileAST(JSON.parse(kernelSource) as Node);

    ast = useBuiltinMath(ast);

    fs.writeFileSync(filename.slice(0, -5) + '.export.c', ast.exportAsCode());
}

//fs.writeFileSync(outputFile, source.exportAsScript());
