
import { Node, convertToTypedAST } from './ast';
import { ExportableScript } from './exportable';

export function importScriptFromSourceCode(source: string): ExportableScript {
    const ast = convertToTypedAST(JSON.parse(source) as Node);
    console.log(ast);
    return {} as ExportableScript;
}
