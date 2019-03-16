
import {
    ConstantValue, GlobalInterface, ConstantInterface, VariableInterface,
    KernelInterface
} from '../defintions';
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

abstract class Exportable {
    abstract exportAsScript(): string;
}

abstract class ExportableGlobal extends Exportable implements GlobalInterface {
    name: string;
    type: string;
    isArray: boolean;
    value: ConstantValue;

    // The source string for the value is used to ensure that the float
    // represenation is completly identical to the C source code.
    valueSource: string;
    constructorName: string;

    constructor(constructorName: string, node: Decl) {
        super();

        this.constructorName = constructorName;
        this.name = node.name;
        this.isArray = node.type instanceof ArrayDecl;

        const typeDecl = this.isArray ? node.type.type : node.type;
        if (!(typeDecl instanceof TypeDecl)) {
            throw new Error('unreachable');
        }
        this.type = typeDecl.type.names[0];

        if (this.isArray) {
            if (node.init instanceof InitList && this.type === 'float') {
                const values = node.init.exprs.map(getValueFromExpression);

                this.valueSource = `[${values.join(', ')}]`;
                this.value = new Float32Array(JSON.parse(this.valueSource));
            } else {
                throw new Error(`unsupported array type ${this.type}`);
            }
        } else {
            this.valueSource = getValueFromExpression(node.init);
            this.value = JSON.parse(this.valueSource);
        }
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

export class ExportableConstant extends ExportableGlobal implements ConstantInterface {
    isConstant: true;

    constructor(node: Decl) {
        super('Constant', node);
    }

    static match(node: Node): node is Decl {
        return (ExportableGlobal.match(node) &&
                /^[0-9a-z]+_[0-9A-Z]+$/.test(node.name));
    }
}

export class ExportableVariable extends ExportableGlobal implements VariableInterface {
    isConstant: false;

    constructor(node: Decl) {
        super('Variable', node);
    }

    static KNOWN_VARIABLES = ['sgngamf'];

    static match(node: Node): node is Decl {
        return (ExportableGlobal.match(node) &&
                ExportableVariable.KNOWN_VARIABLES.indexOf(node.name) !== -1);
    }
}

export class ExportableKernel extends Exportable implements KernelInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    code: string;

    constructor(functions: Set<string>, constants: Set<string>,
                variables: Set<string>, node: FuncDef) {
        super();
        const self = this;

        this.name = node.decl.name;
        this.dependencies = [];
        this.constants = [];
        this.variables = [];
        this.code = node.exportAsCode();

        node.body.transformChildren(function scan(child) {
            if (child instanceof ID) {
                if (functions.has(child.name)) {
                    self.dependencies.push(child.name);
                } else if (constants.has(child.name)) {
                    self.constants.push(child.name);
                } else if (variables.has(child.name)) {
                    self.variables.push(child.name);
                }
            }

            child.transformChildren(scan);
            return child;
        });
    }

    static match(node: Node): node is FuncDef {
        return (node instanceof FuncDef);
    }

    exportAsScript(): string {
        return `linker.add(new Kernel({\n` +
        `  name: ${tsStringifyValue(this.name)},\n` +
        `  dependencies: ${tsStringifyValue(this.dependencies)},\n` +
        `  constants: ${tsStringifyValue(this.constants)},\n` +
        `  code: \`${this.code}\`\n` +
        `}));`;
    }
}

export class ExportableScript implements Exportable {
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
        const imports = [
            `import { ` +
            `Constant, Variable, Kernel` +
            ` } from '../linker;`
        ];

        return [
            '// tslint:disable:max-line-length',
            ...imports,
            ...this.exportables
                .map((exportable) => exportable.exportAsScript())
        ].join('\n\n');
    }
}
