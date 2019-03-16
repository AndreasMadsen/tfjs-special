
export type ConstantValue = Float32Array | number;

export interface GlobalInterface {
    name: string;
    type: string;
    isArray: boolean;
    value: ConstantValue;
}

export interface WebGLExport {
    exportAsWebGL(): string;
}

export abstract class Global implements GlobalInterface, WebGLExport {
    name: string;
    type: string;
    isArray: boolean;
    value: ConstantValue;

    constructor(object: GlobalInterface) {
        this.name = object.name;
        this.type = object.type;
        this.isArray = object.isArray;
        this.value = object.value;
    }

    abstract exportAsWebGL(): string;
}

export interface ConstantInterface extends GlobalInterface {
    isConstant: true;
}

export class Constant extends Global implements ConstantInterface {
    isConstant: true;

    constructor(object: GlobalInterface) {
        super(object);
    }

    exportAsWebGL(): string {
        return '';
    }
}

export interface VariableInterface extends GlobalInterface {
    isConstant: false;
}

export class Variable extends Global implements VariableInterface {
    isConstant: false;

    constructor(object: GlobalInterface) {
        super(object);
    }

    exportAsWebGL(): string {
        return '';
    }
}

export interface KernelInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    code: string;
}

export class Kernel implements KernelInterface, WebGLExport {
    name: string;
    dependencies: string[];
    constants: string[];
    variables: string[];
    code: string;

   constructor(object: KernelInterface) {
        this.name = object.name;
        this.dependencies = object.dependencies;
        this.constants = object.constants;
        this.variables = object.variables;
        this.code = object.code;
    }

    exportAsWebGL(): string {
        return '';
    }
}
