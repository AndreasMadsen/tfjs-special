
import * as tfc from '@tensorflow/tfjs-core';

import { WebGLVersion } from '../defintions';
import { linker } from '../linker';
import { Evaluator } from './abstract';

declare type UniformInfo = {
    value: Float32Array,
    loc?: WebGLUniformLocation
};

declare type UniformMap = Map<string, UniformInfo>;

class WebGL2Compiler implements tfc.webgl.GPGPUProgram {
    variableNames = ['X'];
    userCode: string;
    outputShape: number[];
    uniforms: UniformMap;

    constructor(shape: number[],
                source: string,
                uniforms: UniformMap) {
        this.outputShape = shape;
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
    private source: string;
    private uniforms: UniformMap;
    private program: new(
        shape: number[], source: string, uniforms: UniformMap
    ) => tfc.webgl.GPGPUProgram;

    constructor(fnname: string, version: WebGLVersion) {
        super(fnname);
        this.program = webglCompiler[version];

        this.uniforms = new Map();
        if (version < 2) {
            for (const [name, value] of linker.exportUniforms(fnname)) {
                this.uniforms.set(name, { value });
            }
        }

        this.source = `
            ${linker.exportAsWebGL(fnname, version)}

            void main() {
                float x = getXAtOutCoords();
                float value = gammaf(x);
                setOutput(value);
            }
        `;
    }

    run<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R> {
        const program = new this.program(
            input.shape, this.source, this.uniforms
        );
        const webglBackend = tfc.backend() as tfc.webgl.MathBackendWebGL;
        return webglBackend.compileAndRun(program, [input]);
    }
}
