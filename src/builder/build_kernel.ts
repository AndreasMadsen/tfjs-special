
import * as fs from 'fs';
import * as path from 'path';

import { importExportableFromSourceCode } from './import';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const basename = path.basename(inputFile, '.json');
const source = fs.readFileSync(inputFile, 'utf-8');

const exportable = importExportableFromSourceCode(basename, source);
fs.writeFileSync(outputFile, exportable.exportAsScript());
