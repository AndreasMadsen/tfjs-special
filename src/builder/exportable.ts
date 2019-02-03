
import { KernelConstantType, KernelConstantValue, KernelConstant,
         KernelInterface } from '../defintions';

interface Exportable {
    exportAsScript(): string;
}

export class ExportableKernelConstant extends KernelConstant implements Exportable {
    valueSource: string;

    constructor(name: string,
                type: KernelConstantType,
                isArray: boolean,
                value: KernelConstantValue,
                valueSource: string) {
        super(name, type, isArray, value);

        // The source string for the value is used to ensure that the float
        // represenation is completly identical to the C source code.
        this.valueSource = valueSource;
    }

    exportAsScript(): string {
        let valueIdentifer;
        if (!this.isArray) {
            valueIdentifer = `${this.valueSource}`;
        } else if (this.isArray && this.type === KernelConstantType.float) {
            valueIdentifer = `new Float32Array(${this.valueSource})`;
        } 

        return `new KernelConstant(` +
            `${JSON.stringify(this.name)}, ` +
            `KernelConstantType.${this.type}, ` +
            `${this.isArray}, ` +
            `${valueIdentifer}` +
        `)`;
    }
}

export class ExportableKernel implements KernelInterface, Exportable {
    name: string;
    dependencies: string[];
    constants: ExportableKernelConstant[];
    code: string;

    constructor(name: string,
                dependencies: string[],
                constants: ExportableKernelConstant[],
                code: string) {
        this.name = name;
        this.dependencies = dependencies;
        this.constants = constants;
        this.code = code;
    }

    exportAsScript(): string {
        let constantsSource = '';
        for (const constant of this.constants) {
            constantsSource += `    ${constant.exportAsScript()},\n`;
        }

        return `new Kernel({` +
        `  name: ${JSON.stringify(this.name)},\n` +
        `  dependencies: ${JSON.stringify(this.dependencies)},\n` +
        `  constants: [\n${constantsSource}]\n` +
        `  code: \`${this.code}\`\n` +
        `});`;
    }
}

export class ExportableScript implements Exportable {
    kernels: ExportableKernel[];
    
    constructor(kernels: ExportableKernel[]) {
        this.kernels = kernels;
    }
    
    exportAsScript(): string {
        const imports = [
            `import { ` +
            `Kernel, KernelConstant, KernelConstantType` +
            ` } from '../linker;`
        ];

        const kernels = [];
        for (const kernel of this.kernels) {
            kernels.push(kernel.exportAsScript());
        }

        return `${imports.join('\n')}\n` +
               `${kernels.join('\n')}\n`
        ;
    }
}
