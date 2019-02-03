
import * as fs from 'fs';
import { importScriptFromSource } from './import';

//const inputFile = process.argv[2];
//const outputFile = process.argv[3];

for (const filename of process.argv.slice(2)) {
    const kernelSource = fs.readFileSync(filename, 'utf-8');
    importScriptFromSource(kernelSource);    
}

//fs.writeFileSync(outputFile, source.exportAsScript());
