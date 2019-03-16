
export type ConstantValue = Float32Array | number;

export interface GlobalInterface {
    name: string;
    type: string;
    isArray: boolean;
    value: ConstantValue;
}

export interface ConstantInterface extends GlobalInterface {
    isConstant: true;
}

export interface VariableInterface extends GlobalInterface {
    isConstant: false;
}

export interface KernelInterface {
    name: string;
    dependencies: string[];
    constants: string[];
    code: string;
}
