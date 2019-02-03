
class KernelVariableType {
    type: string;
    isArray: boolean;

    constructor(type: string, isArray: boolean) {
        this.type = type;
        this.isArray = isArray;
    }
}

export let types = {
    array: {
        float: new KernelVariableType("float", true)
    },
    scalar: {
        float: new KernelVariableType("float", false)
    }
}

class KernelConstant {
    name: string;
    type: KernelVariableType;
    value: Array<number> | number;

    constructor(name: string, type: KernelVariableType, value: Array<number> | number) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
}

export function defineConstant(name: string, type: KernelVariableType, value: Array<number> | number) {
    return new KernelConstant(name, type, value);
}

interface KernelDefintionInterface {
    name: string;
    dependencies: Array<Kernel>;
    constants: Array<KernelConstant>;
    code: string;
}

export class Kernel implements KernelDefintionInterface {
    name: string;
    dependencies: Array<Kernel>;
    constants: Array<KernelConstant>;
    code: string;

    constructor(kernelDefintion: KernelDefintionInterface) {
        this.name = kernelDefintion.name;
        this.dependencies = kernelDefintion.dependencies;
        this.constants = kernelDefintion.constants;
        this.code = kernelDefintion.code;
    }
}

class Linker {
    kernels: Array<Kernel>;

    addKernel(kernelDefintion: KernelDefintionInterface): Kernel {
        const kernel = new Kernel(kernelDefintion);
        this.kernels.push(kernel);
        return kernel;
    }
}

export default new Linker();
