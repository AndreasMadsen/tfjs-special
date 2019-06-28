
import * as fs from 'fs';
import * as path from 'path';

import { importAstFromSourceCode } from './import';
import { ExportableScript } from './exportable';

const KERNELDIR = path.resolve(__dirname, '../kernels');

for (const inputFile of process.argv.slice(2)) {
    console.log(`transpiling ${inputFile}`);

    const basename = path.basename(inputFile, '.json');
    const outputFile = path.join(KERNELDIR, basename + '.ts');
    const source = fs.readFileSync(inputFile, 'utf-8');

    const ast = importAstFromSourceCode(basename, source);
    const exportable = new ExportableScript(ast);
    fs.writeFileSync(outputFile, exportable.exportAsScript());
}
