
import * as fs from 'fs';
import { Node, convertToTypedAST } from './ast';

//const inputFile = process.argv[2];
//const outputFile = process.argv[3];

for (const filename of process.argv.slice(2)) {
    const kernelSource = fs.readFileSync(filename, 'utf-8');
    const ast = convertToTypedAST(JSON.parse(kernelSource) as Node);
    fs.writeFileSync(filename.slice(0, -5) + '.export.c', ast.exportAsCode());
}

//fs.writeFileSync(outputFile, source.exportAsScript());
