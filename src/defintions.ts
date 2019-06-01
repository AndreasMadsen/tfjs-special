
export type KernelConstantValue = Float32Array | number;

export interface KernelGlobalInterface {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;
}

export interface WebGLExport {
    exportAsWebGL(): string;
}

export abstract class KernelGlobal implements KernelGlobalInterface, WebGLExport {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;

    constructor(object: KernelGlobalInterface) {
        this.name = object.name;
        this.type = object.type;
        this.value = object.value;
        this.valueString = object.valueString;
    }

    abstract exportAsWebGL(): string;
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
}

export interface KernelFunctionInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    signatureWebGL: string;
    codeWebGL: string;
}

export class KernelFunction implements KernelFunctionInterface, WebGLExport {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    signatureWebGL: string;
    codeWebGL: string;

   constructor(object: KernelFunctionInterface) {
        this.name = object.name;
        this.dependencies = object.dependencies;
        this.constants = object.constants;
        this.variables = object.variables;
        this.signatureWebGL = object.signatureWebGL;
        this.codeWebGL = object.codeWebGL;
    }

    exportSignatureAsWebGL(): string {
        return this.signatureWebGL + ';';
    }

    exportAsWebGL(): string {
        return this.codeWebGL;
    }
}

export declare type KernelPart = KernelConstant | KernelVariable | KernelFunction;
