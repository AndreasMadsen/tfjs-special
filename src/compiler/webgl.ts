
import * as tfc from '@tensorflow/tfjs-core';

import { WebGLVersion } from '../defintions';
import { linker } from '../linker';
import { Evaluator } from './abstract';
import { assertAndGetBroadcastShape } from './broadcast';

declare type UniformInfo = {
    value: Float32Array,
    loc?: WebGLUniformLocation
};

declare type UniformMap = Map<string, UniformInfo>;

class WebGL2Compiler implements tfc.webgl.GPGPUProgram {
    variableNames: string[];
    userCode: string;
    outputShape: number[];
    uniforms: UniformMap;

    constructor(outputShape: number[],
                variableNames: string[],
                source: string,
                uniforms: UniformMap) {
        this.outputShape = outputShape;
        this.variableNames = variableNames;
        this.userCode = source;
        this.uniforms = uniforms;
    }
}

class WebGL1ompiler extends WebGL2Compiler {
    customSetup(gpgpu: tfc.webgl.GPGPUContext,
                webGLProgram: WebGLProgram): void {
        const shouldThrow = false;
        for (let [name, {loc, value}] of this.uniforms.entries()) {
            if (loc === undefined) {
                loc = gpgpu.getUniformLocation(
                    webGLProgram, name, shouldThrow);
                this.uniforms.set(name, { loc, value });
            }
            gpgpu.gl.uniform1fv(loc, value);
        }
    }
}
const webglCompiler = [null, WebGL1ompiler, WebGL2Compiler];

export class WebGLEvaluator extends Evaluator {
    private variableNames: string[];
    private source: string;
    private uniforms: UniformMap;

    private program: new(
        outputShape: number[],
        variableNames: string[],
        source: string,
        uniforms: UniformMap
    ) => tfc.webgl.GPGPUProgram;

    constructor(fnname: string, version: WebGLVersion) {
        super(fnname);
        this.program = webglCompiler[version];

        // pre fetch uniforms, these will be used instead of const arrays
        // if the WebGLVersion < 1.
        this.uniforms = new Map();
        if (version < 2) {
            for (const [name, value] of linker.exportUniforms(fnname)) {
                this.uniforms.set(name, { value });
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

    run(...inputs: tfc.Tensor[]): tfc.Tensor {
        const outputShape = assertAndGetBroadcastShape(
            ...inputs.map((t) => t.shape)
        );
        const program = new this.program(
            outputShape, this.variableNames, this.source, this.uniforms
        );
        const webglBackend = tfc.backend() as tfc.webgl.MathBackendWebGL;
        return webglBackend.compileAndRun(program, inputs);
    }

    runUnary<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R> {
        const program = new this.program(
            input.shape, this.variableNames, this.source, this.uniforms
        );
        const webglBackend = tfc.backend() as tfc.webgl.MathBackendWebGL;
        return webglBackend.compileAndRun(program, [input]);
    }
}
