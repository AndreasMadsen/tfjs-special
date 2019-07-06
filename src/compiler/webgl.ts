
import * as tfc from '@tensorflow/tfjs-core';

import { WebGLVersion } from '../defintions';
import { linker } from '../linker';
import { Evaluator } from './abstract';
import { assertAndGetBroadcastShape } from '../broadcast';

declare type UniformInfo = {
    value: Float32Array,
    loc: Map<string, WebGLUniformLocation>
};

declare type UniformMap = Map<string, UniformInfo>;

class WebGLCompiler implements tfc.webgl.GPGPUProgram {
    variableNames: string[];
    userCode: string;
    outputShape: number[];

    constructor(outputShape: number[],
                variableNames: string[],
                source: string) {
        this.outputShape = outputShape;
        this.variableNames = variableNames;
        this.userCode = source;
    }
}

export class WebGLEvaluator extends Evaluator {
    private version: WebGLVersion;
    private variableNames: string[];
    private source: string;
    private uniforms: UniformMap;

    constructor(fnname: string, version: WebGLVersion) {
        super(fnname);
        this.version = version;

        // pre fetch uniforms, these will be used instead of const arrays
        // if the WebGLVersion < 1.
        this.uniforms = new Map();
        if (this.version < 2) {
            for (const [name, value] of linker.exportUniforms(fnname)) {
                this.uniforms.set(name, { value, loc: new Map() });
            }
        }

        // Fetch function information
        const signature = linker.getSignature(fnname);

        // Preconstruct the variable names list
        this.variableNames = signature.arguments.map((arg) => `V${arg.index}`);

        // Construct main program code
        // * fetch data
        const mainCode = [];
        for (const arg of signature.arguments) {
            mainCode.push(
                `${arg.type} ${arg.name} = getV${arg.index}AtOutCoords();`
            );
        }
        // * call function
        mainCode.push(
            `float value = ${signature.name}(${
                signature.arguments
                    .map((arg) => arg.name)
                    .join(',')
            });`
        );
        // * set output
        mainCode.push('setOutput(value);');

        // Combine main function with source code
        this.source = `
            ${linker.exportAsWebGL(fnname, version)}

            void main() {
                ${mainCode.join('                \n')}
            }
        `;
    }

    private makeProgramLocKey(
        inputs: tfc.Tensor[], outputShape: number[]
    ): string {
        return [
            ...inputs.map((t) => t.shape.join(',')),
            outputShape.join(',')
        ].join('|');
    }

    private customSetup(
        programLocKey: string,
        gpgpu: tfc.webgl.GPGPUContext,
        webGLProgram: WebGLProgram
    ): void {
        const shouldThrow = false;
        for (const [name, {loc, value}] of this.uniforms.entries()) {
            let locValue = loc.get(programLocKey);
            // Fetch if cache is empty
            // TODO: For some reason this does not work across different
            // programs even if the program source code should be identical.
            //if (locValue === undefined) {
            locValue = gpgpu.getUniformLocation(
                webGLProgram, name, shouldThrow);
            loc.set(programLocKey, locValue);
            //}
            gpgpu.gl.uniform1fv(locValue, value);
        }
    }

    private compileAndRun(
        inputs: tfc.Tensor[], outputShape: number[]
    ): tfc.Tensor {
        const program = new WebGLCompiler(
            outputShape, this.variableNames, this.source
        );

        const webglBackend = tfc.backend() as tfc.webgl.MathBackendWebGL;
        if (this.version < 2) {
            return webglBackend.compileAndRun(
                program,
                inputs,
                null,
                (gpgpu, program) => this.customSetup(
                    this.makeProgramLocKey(inputs, outputShape),
                    gpgpu,
                    program)
            );
        } else {
            return webglBackend.compileAndRun(
                program, inputs);
        }
    }

    run(...inputs: tfc.Tensor[]): tfc.Tensor {
        const outputShape = assertAndGetBroadcastShape(
            ...inputs.map((t) => t.shape)
        );

        return this.compileAndRun(inputs, outputShape);
    }

    runUnary<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R> {
        return this.compileAndRun([input], input.shape) as tfc.Tensor<R>;
    }
}
