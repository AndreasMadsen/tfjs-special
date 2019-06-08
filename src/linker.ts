
import { Language, WebGLVersion,
         KernelConstant, KernelVariable,
         KernelFunction, KernelPart } from './defintions';

class Linker {
    constants: Map<string, KernelConstant>;
    variables: Map<string, KernelVariable>;
    functions: Map<string, KernelFunction>;

    constructor() {
        this.constants = new Map();
        this.variables = new Map();
        this.functions = new Map();
    }

    add(code: KernelPart): void {
        if (code instanceof KernelConstant) {
            this.constants.set(code.name, code);
        } else if (code instanceof KernelVariable) {
            this.variables.set(code.name, code);
        } else if (code instanceof KernelFunction) {
            this.functions.set(code.name, code);
        } else {
            throw new Error('unreachable');
        }
    }

    exportAsWebGL(kernelName: string, version: WebGLVersion): string {
        if (version === 2) {
            return this.exportAs(kernelName, 'WebGL2');
        } else {
            return this.exportAs(kernelName, 'WebGL1');
        }
    }

    exportAsJS(kernelName: string): string {
        return this.exportAs(kernelName, 'JS');
    }

    private getKernelParts(kernelName: string): {
        usedConstants: Map<string, KernelConstant>,
        usedVariables: Map<string, KernelVariable>,
        usedFunctions: Map<string, KernelFunction>
    } {
        if (!this.functions.has(kernelName)) {
            throw new Error(`WebGL function ${kernelName} is not declared`);
        }

        const usedConstants = new Map<string, KernelConstant>();
        const usedVariables = new Map<string, KernelVariable>();
        const usedFunctions = new Map<string, KernelFunction>();

        // Resolve depdendency tree by adding collecting all used
        // constants, variables, and functions.
        const todoFunctions = [
            this.functions.get(kernelName)
        ];

        while (todoFunctions.length > 0) {
            const thisFunction = todoFunctions.pop();
            if (usedFunctions.has(thisFunction.name)) {
                // Function is allready added, just skip
                continue;
            }
            usedFunctions.set(thisFunction.name, thisFunction);

            for (const constantName of thisFunction.constants) {
                if (!this.constants.has(constantName)) {
                    throw new Error(`WebGL constant ${constantName} used `+
                                    `by ${thisFunction.name} is not declared`);
                }
                usedConstants.set(constantName,
                                  this.constants.get(constantName));
            }

            for (const variableName of thisFunction.variables) {
                if (!this.variables.has(variableName)) {
                    throw new Error(`WebGL variable ${variableName} used `+
                                    `by ${thisFunction.name} is not declared`);
                }
                usedVariables.set(variableName,
                                  this.variables.get(variableName));
            }

            for (const functionName of thisFunction.dependencies) {
                if (!this.functions.has(functionName)) {
                    throw new Error(`WebGL function ${functionName} used `+
                                    `by ${thisFunction.name} is not declared`);
                }
                if (!usedFunctions.has(functionName)) {
                    todoFunctions.push(this.functions.get(functionName));
                }
            }
        }

        return {
            usedConstants,
            usedVariables,
            usedFunctions
        };
    }

    exportUniforms(kernelName: string): Map<string, Float32Array> {
        const { usedConstants,
                usedVariables } = this.getKernelParts(kernelName);

        const uniforms = new Map<string, Float32Array>();

        for (const kernel of usedConstants.values()) {
            if (kernel.value instanceof Float32Array) {
                uniforms.set(kernel.name, kernel.value);
            }
        }

        for (const kernel of usedVariables.values()) {
            if (kernel.value instanceof Float32Array) {
                uniforms.set(kernel.name, kernel.value);
            }
        }

        return uniforms;
    }

    exportAs(kernelName: string, language: Language): string {
        const { usedConstants,
                usedVariables,
                usedFunctions } = this.getKernelParts(kernelName);

        // transform into code
        const constantCode = Array.from(usedConstants.values())
            .map((kernelConstant) => kernelConstant.exportAs(language))
            .join('\n');

        const variableCode =  Array.from(usedVariables.values())
            .map((kernelVariable) => kernelVariable.exportAs(language))
            .join('\n');

        const signatureCode = Array.from(usedFunctions.values())
            .map((kernelFunction) => kernelFunction.exportSignatureAs(language))
            .filter((signatureCode) => signatureCode !== null)
            .join('\n');

        const functionCode =  Array.from(usedFunctions.values())
            .map((kernelFunction) => kernelFunction.exportAs(language))
            .filter((code) => code !== null)
            .join('\n\n');

        return [
            `// compiled kernel for ${kernelName}`,
            '',
            '//',
            '// constant declarations',
            '//',
            constantCode,
            '',
            '//',
            '// global variable declarations :(',
            '//',
            variableCode,
            '',
            '//',
            '// function signatures',
            '//',
            signatureCode,
            '',
            '//',
            '// function declarations',
            '//',
            functionCode,
            ''
        ].join('\n');
    }
}

export const linker = new Linker();
