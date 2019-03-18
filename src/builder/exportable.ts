
import { KernelGlobal, KernelFunction, KernelConstant, KernelVariable } from '../defintions';
import {
    FileAST, Node,
    Decl, ArrayDecl, TypeDecl, FuncDecl,
    ID, InitList, FuncDef
} from './ast';

function getValueFromExpression(node: Node) {
    let str = node.exportAsCode();
    if (str.endsWith('f')) {
        str = str.slice(0, -1);
    }
    if (str.endsWith('.')) {
        str += '0';
    }
    return str;
}

function tsStringifyValue(array: string | string[]) {
    return JSON.stringify(array).replace(/"/g, '\'');
}

interface ExportableInterface {
    exportAsScript(): string;
}

abstract class ExportableKernelGlobal
         extends KernelGlobal
         implements ExportableInterface {
    constructorName: string;

    constructor(constructorName: string, node: Decl) {
        const name = node.name;
        const isArray = node.type instanceof ArrayDecl;

        const typeDecl = isArray ? node.type.type : node.type;
        if (!(typeDecl instanceof TypeDecl)) {
            throw new Error('unreachable');
        }
        const type = typeDecl.type.names[0];
        let value, valueString;

        if (isArray) {
            if (node.init instanceof InitList && type === 'float') {
                const values = node.init.exprs.map(getValueFromExpression);

                valueString = `${values.join(', ')}`;
                value = new Float32Array(JSON.parse(`[${valueString}]`));
            } else {
                throw new Error(`unsupported array type ${type}`);
            }
        } else {
            valueString = getValueFromExpression(node.init);
            value = JSON.parse(valueString);
        }

        super({ name, type, value, valueString });
        this.constructorName = constructorName;
    }

    static match(node: Node): node is Decl {
        return (node instanceof Decl &&
                node.storage.indexOf('extern') === -1 &&
                node.init !== null);
    }

    exportAsScript(): string {
        let valueIdentifer;
        if (this.value instanceof Float32Array) {
            valueIdentifer = `new Float32Array([${this.valueString}])`;
        } else {
            valueIdentifer = `${this.valueString}`;
        }

        return `linker.add(new ${this.constructorName}({\n` +
        `  name: ${tsStringifyValue(this.name)},\n` +
        `  type: ${tsStringifyValue(this.type)},\n` +
        `  value: ${valueIdentifer},\n` +
        `  valueString: ${tsStringifyValue(this.valueString)}\n` +
        `}));`;
    }
}

export class ExportableKernelConstant extends ExportableKernelGlobal implements KernelConstant {
    isConstant: true;

    constructor(node: Decl) {
        super('KernelConstant', node);
    }

    static match(node: Node): node is Decl {
        return (ExportableKernelGlobal.match(node) &&
                /^([0-9a-z]+_)?[0-9A-Z]+$/.test(node.name));
    }

    exportAsWebGL(): string {
        return KernelConstant.prototype.exportAsWebGL.call(this);
    }
}

export class ExportableKernelVariable extends ExportableKernelGlobal implements KernelVariable {
    isConstant: false;

    constructor(node: Decl) {
        super('KernelVariable', node);
    }

    static KNOWN_VARIABLES = new Set(['sgngamf']);

    static match(node: Node): node is Decl {
        return (ExportableKernelGlobal.match(node) &&
                ExportableKernelVariable.KNOWN_VARIABLES.has(node.name));
    }

    exportAsWebGL(): string {
        return KernelVariable.prototype.exportAsWebGL.call(this);
    }
}

export class ExportableKernelFunction extends KernelFunction implements ExportableInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    code: string;

    constructor(allFunctions: Set<string>, allConstants: Set<string>,
                allVariables: Set<string>, node: FuncDef) {
        const name = node.decl.name;
        const dependencies = new Set<string>();
        const constants = new Set<string>();
        const variables = new Set<string>();
        const code = node.exportAsCode();
        const signature = node.decl.type.exportAsCode();

        node.body.transformChildren(function scan(child) {
            if (child instanceof ID) {
                if (allFunctions.has(child.name)) {
                    dependencies.add(child.name);
                } else if (allConstants.has(child.name)) {
                    constants.add(child.name);
                } else if (allVariables.has(child.name)) {
                    variables.add(child.name);
                }
            }

            child.transformChildren(scan);
            return child;
        });

        super({
            'name': name,
            'dependencies': Array.from(dependencies),
            'constants': Array.from(constants),
            'variables': Array.from(variables),
            'signature': signature,
            'code': code
        });
    }

    static match(node: Node): node is FuncDef {
        return (node instanceof FuncDef);
    }

    exportAsScript(): string {
        return `linker.add(new KernelFunction({\n` +
        `  name: ${tsStringifyValue(this.name)},\n` +
        `  dependencies: ${tsStringifyValue(this.dependencies)},\n` +
        `  constants: ${tsStringifyValue(this.constants)},\n` +
        `  variables: ${tsStringifyValue(this.variables)},\n` +
        `  signature: ${tsStringifyValue(this.signature)},\n` +
        `  code: \`${this.code}\`\n` +
        `}));`;
    }
}

declare type Exportable = ExportableKernelConstant | ExportableKernelVariable |
                          ExportableKernelFunction;

export class ExportableScript implements ExportableInterface {
    exportables: Exportable[];

    constructor(ast: FileAST) {
        const allFunctions = new Set();
        const allConstants = new Set();
        const allVariables = new Set();

        for (const child of ast.ext) {
            if (child instanceof Decl &&
                ExportableKernelVariable.KNOWN_VARIABLES.has(child.name)) {
                allVariables.add(child.name);
            } else if (child instanceof Decl &&
                       child.type instanceof FuncDecl) {
                allFunctions.add(child.name);
            } else if (child instanceof FuncDef) {
                allFunctions.add(child.decl.name);
            } else if (child instanceof Decl) {
                allConstants.add(child.name);
            } else {
                throw new Error('unreachable');
            }
        }

        this.exportables = [];
        for (const child of ast.ext) {
            if (ExportableKernelConstant.match(child)) {
                this.exportables.push(new ExportableKernelConstant(child));
            } else if (ExportableKernelVariable.match(child)) {
                this.exportables.push(new ExportableKernelVariable(child));
            } else if (ExportableKernelFunction.match(child)) {
                this.exportables.push(
                    new ExportableKernelFunction(
                        allFunctions, allConstants, allVariables, child)
                );
            }
        }
    }

    exportAsScript(): string {
        const defintionsImports = new Set();

        for (const exportable of this.exportables) {
            if (exportable instanceof ExportableKernelConstant) {
                defintionsImports.add('KernelConstant');
            } else if (exportable instanceof ExportableKernelVariable) {
                defintionsImports.add('KernelVariable');
            } else if (exportable instanceof ExportableKernelFunction) {
                defintionsImports.add('KernelFunction');
            }
        }

        const imports = [];
        if (defintionsImports.size > 0) {
            imports.push(
                `import { `
                    + Array.from(defintionsImports).join(', ') +
                ` } from '../defintions';`
            );
            imports.push(`import { linker } from '../linker';`);
        }

        return [
            '// tslint:disable:max-line-length',
            imports.join('\n'),
            ...this.exportables
                .map((exportable) => exportable.exportAsScript())
        ].join('\n\n');
    }
}
