
import * as fs from 'fs';
import * as path from 'path';

import { importAstFromSourceCode } from './import';
import { ExportableScript } from './exportable';

for (const inputFile of process.argv.slice(2)) {
    console.log(inputFile);

    const basename = path.basename(inputFile, '.json');
    const cOutputFile = path.join(
        path.dirname(inputFile), basename + '.export.c');
    const tsOutputFile = path.resolve(
        __dirname, '../kernels', basename + '.ts');
    const source = fs.readFileSync(inputFile, 'utf-8');

    const ast = importAstFromSourceCode(basename, source);
    fs.writeFileSync(cOutputFile, ast.exportAsWebGL());

    const exportable = new ExportableScript(ast);
    fs.writeFileSync(tsOutputFile, exportable.exportAsScript());
}