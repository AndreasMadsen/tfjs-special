
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
    signature: string;
    code: string;
}

export class KernelFunction implements KernelFunctionInterface, WebGLExport {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    signature: string;
    code: string;

   constructor(object: KernelFunctionInterface) {
        this.name = object.name;
        this.dependencies = object.dependencies;
        this.constants = object.constants;
        this.variables = object.variables;
        this.signature = object.signature;
        this.code = object.code;
    }

    exportSignatureAsWebGL(): string {
        return this.signature + ';';
    }

    exportAsWebGL(): string {
        return this.code;
    }
}

export declare type KernelPart = KernelConstant | KernelVariable | KernelFunction;
