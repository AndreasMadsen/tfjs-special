
import * as fs from 'fs';
import * as path from 'path';

import { importExportableFromSourceCode } from './import';

for (const filename of process.argv.slice(2)) {
    const basename = path.basename(filename, '.json');
    const exportFilename = filename.slice(0, -5) + '.ts';
    const source = fs.readFileSync(filename, 'utf-8');

    // contains recursion
    if (filename === 'cephes/jvf.json') {
        continue;
    }

    const exportable = importExportableFromSourceCode(basename, source);

    fs.writeFileSync(exportFilename, exportable.exportAsScript());
}

//fs.writeFileSync(outputFile, source.exportAsScript());
