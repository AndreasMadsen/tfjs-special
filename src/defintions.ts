
export enum KernelConstantType {
    float = 'float'
}

export type KernelConstantValue = Float32Array | number;

export interface KernelConstantInterface {
    name: string;
    type: KernelConstantType;
    value: KernelConstantValue;
}

export class KernelConstant implements KernelConstantInterface {
    name: string;
    type: KernelConstantType;
    isArray: boolean;
    value: KernelConstantValue;

    constructor(name: string,
                type: KernelConstantType,
                isArray: boolean,
                value: KernelConstantValue) {
        this.name = name;
        this.type = type;
        this.isArray = isArray;
        this.value = value;
    }
}

export interface KernelInterface {
    name: string;
    dependencies: string[];
    constants: KernelConstantInterface[];
    code: string;
}
