
import { Global, Kernel, Constant, Variable } from '../defintions';
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

abstract class ExportableGlobal extends Global implements ExportableInterface {
    // The source string for the value is used to ensure that the float
    // represenation is completly identical to the C source code.
    valueSource: string;
    constructorName: string;

    constructor(constructorName: string, node: Decl) {
        const name = node.name;
        const isArray = node.type instanceof ArrayDecl;

        const typeDecl = isArray ? node.type.type : node.type;
        if (!(typeDecl instanceof TypeDecl)) {
            throw new Error('unreachable');
        }
        const type = typeDecl.type.names[0];
        let value, valueSource;

        if (isArray) {
            if (node.init instanceof InitList && type === 'float') {
                const values = node.init.exprs.map(getValueFromExpression);

                valueSource = `[${values.join(', ')}]`;
                value = new Float32Array(JSON.parse(valueSource));
            } else {
                throw new Error(`unsupported array type ${type}`);
            }
        } else {
            valueSource = getValueFromExpression(node.init);
            value = JSON.parse(valueSource);
        }

        super({ name, type, isArray, value });
        this.constructorName = constructorName;
        this.valueSource = valueSource;
    }

    static match(node: Node): node is Decl {
        return (node instanceof Decl &&
                node.storage.indexOf('extern') === -1 &&
                node.init !== null);
    }

    exportAsScript(): string {
        let valueIdentifer;
        if (!this.isArray) {
            valueIdentifer = `${this.valueSource}`;
        } else if (this.isArray && this.type === 'float') {
            valueIdentifer = `new Float32Array(${this.valueSource})`;
        }

        return `linker.add(new ${this.constructorName}({\n` +
        `  name: ${tsStringifyValue(this.name)},\n` +
        `  type: ${tsStringifyValue(this.type)},\n` +
        `  isArray: ${this.isArray},\n` +
        `  value: ${valueIdentifer}\n` +
        `}));`;
    }
}

export class ExportableConstant extends ExportableGlobal implements Constant {
    isConstant: true;

    constructor(node: Decl) {
        super('Constant', node);
    }

    static match(node: Node): node is Decl {
        return (ExportableGlobal.match(node) &&
                /^[0-9a-z]+_[0-9A-Z]+$/.test(node.name));
    }

    exportAsWebGL(): string {
        return Constant.prototype.exportAsWebGL.call(this);
    }
}

export class ExportableVariable extends ExportableGlobal implements Variable {
    isConstant: false;

    constructor(node: Decl) {
        super('Variable', node);
    }

    static KNOWN_VARIABLES = ['sgngamf'];

    static match(node: Node): node is Decl {
        return (ExportableGlobal.match(node) &&
                ExportableVariable.KNOWN_VARIABLES.indexOf(node.name) !== -1);
    }

    exportAsWebGL(): string {
        return Variable.prototype.exportAsWebGL.call(this);
    }
}

export class ExportableKernel extends Kernel implements ExportableInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    code: string;

    constructor(allFunctions: Set<string>, allConstants: Set<string>,
                allVariables: Set<string>, node: FuncDef) {
        const name = node.decl.name;
        const dependencies: string[] = [];
        const constants: string[] = [];
        const variables: string[] = [];
        const code = node.exportAsCode();

        node.body.transformChildren(function scan(child) {
            if (child instanceof ID) {
                if (allFunctions.has(child.name)) {
                    dependencies.push(child.name);
                } else if (allConstants.has(child.name)) {
                    constants.push(child.name);
                } else if (allVariables.has(child.name)) {
                    variables.push(child.name);
                }
            }

            child.transformChildren(scan);
            return child;
        });

        super({ name, dependencies, constants, variables, code });
    }

    static match(node: Node): node is FuncDef {
        return (node instanceof FuncDef);
    }

    exportAsScript(): string {
        return `linker.add(new Kernel({\n` +
        `  name: ${tsStringifyValue(this.name)},\n` +
        `  dependencies: ${tsStringifyValue(this.dependencies)},\n` +
        `  constants: ${tsStringifyValue(this.constants)},\n` +
        `  variables: ${tsStringifyValue(this.variables)},\n` +
        `  code: \`${this.code}\`\n` +
        `}));`;
    }
}

declare type Exportable = ExportableConstant | ExportableVariable |
                          ExportableKernel;

export class ExportableScript implements ExportableInterface {
    exportables: Exportable[];

    constructor(ast: FileAST) {
        const functions = new Set();
        const constants = new Set();
        const variables = new Set();

        for (const child of ast.ext) {
            if (child instanceof Decl &&
                ExportableVariable.KNOWN_VARIABLES.indexOf(child.name) !== -1) {
                variables.add(child.name);
            } else if (child instanceof Decl &&
                       child.type instanceof FuncDecl) {
                functions.add(child.name);
            } else if (child instanceof FuncDef) {
                functions.add(child.decl.name);
            } else if (child instanceof Decl) {
                constants.add(child.name);
            } else {
                throw new Error('unreachable');
            }
        }

        this.exportables = [];
        for (const child of ast.ext) {
            if (ExportableConstant.match(child)) {
                this.exportables.push(new ExportableConstant(child));
            } else if (ExportableVariable.match(child)) {
                this.exportables.push(new ExportableVariable(child));
            } else if (ExportableKernel.match(child)) {
                this.exportables.push(
                    new ExportableKernel(functions, constants, variables, child)
                );
            }
        }
    }

    exportAsScript(): string {
        const defintionsImports = new Set();

        for (const exportable of this.exportables) {
            if (exportable instanceof ExportableConstant) {
                defintionsImports.add('Constant');
            } else if (exportable instanceof ExportableVariable) {
                defintionsImports.add('Variable');
            } else if (exportable instanceof ExportableKernel) {
                defintionsImports.add('Kernel');
            }
        }

        const imports = [
            `import { `
                + Array.from(defintionsImports).join(', ') +
            ` } from '../defintions';`,
            `import { linker } from '../linker';`
        ];

        return [
            '// tslint:disable:max-line-length',
            imports.join('\n'),
            ...this.exportables
                .map((exportable) => exportable.exportAsScript())
        ].join('\n\n');
    }
}
