
export type Language = 'WebGL2' | 'WebGL1' | 'JS';
export type WebGLVersion = 1 | 2;
export type KernelType = 'Constant' | 'Variable' | 'Function';

export type KernelConstantValue = Float32Array | number;

export interface KernelGlobalInterface {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;
}

export abstract class Export {
    exportAs(language: Language): string {
        switch (language) {
            case 'WebGL1':
                return this.exportAsWebGL(1);
            case 'WebGL2':
                return this.exportAsWebGL(2);
            case 'JS':
                return this.exportAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    abstract exportAsWebGL(version: WebGLVersion): string;
    abstract exportAsJS(): string;
}

export abstract class KernelGlobal extends Export implements KernelGlobalInterface {
    name: string;
    type: string;
    value: KernelConstantValue;
    valueString: string;
    kernelType: KernelType;

    constructor(object: KernelGlobalInterface) {
        super();

        this.name = object.name;
        this.type = object.type;
        this.value = object.value;
        this.valueString = object.valueString;
    }
}

export class KernelConstant extends KernelGlobal implements KernelGlobalInterface {
    kernelType: 'Constant' = 'Constant';

    constructor(object: KernelGlobalInterface) {
        super(object);
    }

    exportAsWebGL(version: WebGLVersion): string {
        if (this.value instanceof Float32Array) {
            if (version === 2) {
                return `float ${this.name}[${this.value.length}] = ` +
                    `float[](${this.valueString});`;
            } else {
                return `uniform float ${this.name}[${this.value.length}];`;
            }
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

export class KernelVariable extends KernelGlobal implements KernelGlobalInterface {
    kernelType: 'Variable' = 'Variable';

    constructor(object: KernelGlobalInterface) {
        super(object);
    }

    exportResetAs(language: Language): string {
        switch (language) {
            case 'WebGL1':
                return this.exportResetAsWebGL(1);
            case 'WebGL2':
                return this.exportResetAsWebGL(2);
            case 'JS':
                return this.exportResetAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    exportResetAsWebGL(version: WebGLVersion): string {
        return `// WebGL does not need resetting of ${this.name}`;
    }

    // This does nothing, but helps with abstraction
    exportResetAsJS(): string {
        if (this.value instanceof Float32Array) {
            throw new Error(`can not reset ${this.name}`);
        }
        return `${this.name} = ${this.valueString};`;
    }

    exportAsWebGL(version: WebGLVersion): string {
        if (this.value instanceof Float32Array) {
            if (version === 2) {
                return `float ${this.name}[${this.value.length}] = ` +
                    `float[](${this.valueString});`;
            } else {
                return `uniform float ${this.name}[${this.value.length}];`;
            }
        } else {
            return `${this.type} ${this.name} = ${this.valueString};`;
        }
    }

    exportAsJS(): string {
        if (this.value instanceof Float32Array) {
            return `let ${this.name} = ` +
                `new Float32Array([${this.valueString}]);`;
        } else {
            return `let ${this.name} = ${this.valueString};`;
        }
    }
}

export interface KernelFunctionSignatureArgumentInterface {
    name: string;
    type: string;
    index: number;
}

export class KernelFunctionSignatureArgument extends Export implements KernelFunctionSignatureArgumentInterface {
    name: string;
    type: string;
    index: number;

    constructor(object: KernelFunctionSignatureArgumentInterface) {
        super();

        this.name = object.name;
        this.type = object.type;
        this.index = object.index;
    }

    exportAsWebGL(version: WebGLVersion): string {
        const arraySeperator = this.type.indexOf('[');
        if (arraySeperator !== -1) {
            return (
                `${this.type.slice(0, arraySeperator)}` +
                ` ${this.name}${this.type.slice(arraySeperator)}`
            );
        } else {
            return `${this.type} ${this.name}`;
        }
    }

    exportAsJS(): string {
        return `${this.name}`;
    }
}

export interface KernelFunctionSignatureInterface {
    name: string;
    type: string;
    arguments: KernelFunctionSignatureArgumentInterface[];
}

export class KernelFunctionSignature extends Export implements KernelFunctionSignatureInterface {
    name: string;
    type: string;
    arguments: KernelFunctionSignatureArgument[];

    constructor(object: KernelFunctionSignatureInterface) {
        super();

        this.name = object.name;
        this.type = object.type;
        this.arguments = object.arguments
            .map((arg) => new KernelFunctionSignatureArgument(arg));
    }

    exportAsWebGL(version: WebGLVersion): string {
        const args = this.arguments
            .map((arg) => arg.exportAsWebGL(version))
            .join(', ');

        return `${this.type} ${this.name}(${args})`;
    }

    exportAsJS(): string {
        const args = this.arguments
            .map((arg) => arg.exportAsJS())
            .join(', ');

        return `function ${this.name}(${args})`;
    }
}

export interface KernelFunctionInterface {
    dependencies: string[];
    constants: string[];
    variables: string[];
    signature: KernelFunctionSignatureInterface;
    codeWebGL: string;
    codeJS: string;
}

export class KernelFunction extends Export implements KernelFunctionInterface {
    dependencies: string[];
    constants: string[];
    variables: string[];
    signature: KernelFunctionSignature;
    codeWebGL: string;
    codeJS: string;
    kernelType: 'Function' = 'Function';

   constructor(object: KernelFunctionInterface) {
        super();

        this.dependencies = object.dependencies;
        this.constants = object.constants;
        this.variables = object.variables;
        this.signature = new KernelFunctionSignature(object.signature);
        this.codeWebGL = object.codeWebGL;
        this.codeJS = object.codeJS;
    }

    get name(): string {
        return this.signature.name;
    }

    exportSignatureAs(language: Language): string {
        switch (language) {
            case 'WebGL1':
                return this.exportSignatureAsWebGL(1);
            case 'WebGL2':
                return this.exportSignatureAsWebGL(2);
            case 'JS':
                return this.exportSignatureAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    exportSignatureAsWebGL(version: WebGLVersion): string {
        if (this.codeWebGL === null) {
            return null;
        }
        return this.signature.exportAsWebGL(version) + ';';
    }

    // This does nothing, but helps with abstraction
    exportSignatureAsJS(): string {
        if (this.codeJS === null) {
            return null;
        }
        return '//' + this.signature.exportAsJS();
    }

    exportAsWebGL(version: WebGLVersion): string {
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
