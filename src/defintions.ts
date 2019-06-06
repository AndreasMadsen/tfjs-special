
export type KernelConstantValue = Float32Array | number;
export type Language = 'WebGL' | 'JS';

export interface KernelGlobalInterface {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;
}

export abstract class Export {
    exportAs(language: Language): string {
        switch (language) {
            case 'WebGL':
                return this.exportAsWebGL();
            case 'JS':
                return this.exportAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    abstract exportAsWebGL(): string;
    abstract exportAsJS(): string;
}

export abstract class KernelGlobal extends Export implements KernelGlobalInterface {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;

    constructor(object: KernelGlobalInterface) {
        super();

        this.name = object.name;
        this.type = object.type;
        this.value = object.value;
        this.valueString = object.valueString;
    }
}

export interface ConstantInterface extends KernelGlobalInterface {
    isConstant: true;
}

export class KernelConstant extends KernelGlobal implements ConstantInterface {
    isConstant: true;

    constructor(object: KernelGlobalInterface) {
        super(object);
    }

    exportAsWebGL(): string {
        if (this.value instanceof Float32Array) {
            return `const float ${this.name}[${this.value.length}] = ` +
                `float[](${this.valueString});`;
        } else {
            return `const ${this.type} ${this.name} = ${this.valueString};`;
        }
    }

    exportAsJS(): string {
        if (this.value instanceof Float32Array) {
            return `const ${this.name} = ` +
                `new Float32Array([${this.valueString}]);`;
        } else {
            return `const ${this.name} = ${this.valueString};`;
        }
    }
}

export interface KernelVariableInterface extends KernelGlobalInterface {
    isConstant: false;
}

export class KernelVariable extends KernelGlobal implements KernelVariableInterface {
    isConstant: false;

    constructor(object: KernelGlobalInterface) {
        super(object);
    }

    exportAsWebGL(): string {
        if (this.value instanceof Float32Array) {
            return `float ${this.name}[${this.value.length}] = ` +
                `float[](${this.valueString});`;
        } else {
            return `${this.type} ${this.name} = ${this.valueString};`;
        }
    }

    exportAsJS(): string {
        if (this.value instanceof Float32Array) {
            return `const ${this.name} = ` +
                `new Float32Array([${this.valueString}]);`;
        } else {
            return `const ${this.name} = ${this.valueString};`;
        }
    }
}

export interface KernelFunctionInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    signatureWebGL: string;
    codeWebGL: string;
    codeJS: string;
}

export class KernelFunction extends Export implements KernelFunctionInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    signatureWebGL: string;
    codeWebGL: string;
    codeJS: string;

   constructor(object: KernelFunctionInterface) {
        super();

        this.name = object.name;
        this.dependencies = object.dependencies;
        this.constants = object.constants;
        this.variables = object.variables;
        this.signatureWebGL = object.signatureWebGL;
        this.codeWebGL = object.codeWebGL;
        this.codeJS = object.codeJS;
    }

    exportSignatureAs(language: Language): string {
        switch (language) {
            case 'WebGL':
                return this.exportSignatureAsWebGL();
            case 'JS':
                return this.exportSignatureAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    // This does nothing but helps with abstraction
    exportSignatureAsJS(): string {
        if (this.signatureWebGL === null) {
            return null;
        }
        return '//' + this.signatureWebGL;
    }

    exportSignatureAsWebGL(): string {
        if (this.signatureWebGL === null) {
            return null;
        }
        return this.signatureWebGL + ';';
    }

    exportAsWebGL(): string {
        if (this.codeWebGL === null) {
            return null;
        }
        return this.codeWebGL;
    }

    exportAsJS(): string {
        if (this.codeJS === null) {
            return null;
        }
        return this.codeJS;
    }
}

export declare type KernelPart = KernelConstant | KernelVariable | KernelFunction;
