
import * as fs from 'fs';
import * as path from 'path';

import { linker } from '../src/linker';
import { importAstFromSourceCode } from './import';
import { ExportableScript } from './exportable';

import '../src/special_kernels';

const ROOTDIR = path.resolve(__dirname, '..');
const KERNELDIR = path.resolve(ROOTDIR, 'src', 'kernels');
const CEPHESDIR = path.resolve(ROOTDIR, 'deps', 'cephes');
const EXPORTS = [
    'lgamf', 'psif', 'gammaf', 'igamf', 'igamcf',
    'i0f', 'i1f', 'i0ef', 'i1ef', 'ivf',
    'betaf', 'incbetf',
    'erff', 'erfcf',
    'zetaf'
];

const cephesFiles = fs.readdirSync(CEPHESDIR)
    .filter((name) => path.extname(name) === '.json');

// transpile all kernels
const kernels = new Map<string, ExportableScript>();
for (const filename of cephesFiles) {
    console.log(`transpiling ${filename}`);

    const basename = path.basename(filename, '.json');
    // This contains goto statements that looks recursive
    // (although they actually aren't). As the file isn't required anyway
    // just skip it.
    if (basename === 'jvf') {
        continue;
    }

    const source = fs.readFileSync(path.resolve(CEPHESDIR, filename), 'utf-8');

    const ast = importAstFromSourceCode(basename, source);
    const exportable = new ExportableScript(ast);
    exportable.addToLinker(linker);
    kernels.set(filename, exportable);
}

// compile a list of all used symbols
const allKernelSymbols = new Set<string>();
for (const exportName of EXPORTS) {
    for (const kernelSymbol of linker.getUsedSymbols(exportName)) {
        allKernelSymbols.add(kernelSymbol);
    }
}

// filter and reduce all exportable scripts to only include used symbols
const indexFileContent = [];
for (const [filename, exportable] of kernels) {
    exportable.reduceExportables(allKernelSymbols);
    if (exportable.hasContent()) {
        console.log(`exporting ${filename}`);
        const basename = path.basename(filename, '.json');
        const outputFile = path.join(KERNELDIR, basename + '.ts');

        indexFileContent.push(`import './${basename}';`);
        fs.writeFileSync(outputFile, exportable.exportAsScript());
    }
}

//
console.log('building index');
fs.writeFileSync(
    path.resolve(KERNELDIR, 'index.ts'),
    indexFileContent.join('\n') + '\n'
);
