
import * as tfc from '@tensorflow/tfjs-core';

import { linker } from '../linker';
import { Evaluator } from './abstract';

export class CPUEvaluator extends Evaluator {
    private program: (x: number) => number;

    constructor(fnname: string) {
        super(fnname);

        const sourceCode = `
            'strict mode';

            ${linker.exportAsJS(fnname)}

            function main(x) {
                sgngamf = 0; // Reset global variables
                return gammaf(x);
            }

            return main;
        `;

        this.program = (new Function(sourceCode))();
    }

    run<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R> {
        const values = input.dataSync<'float32'>();
        const newValues = new Float32Array(values.length);

        for (let i = 0; i < values.length; ++i) {
            const value = values[i];
            newValues[i] = this.program(value);
        }

        return tfc.Tensor.make(input.shape, {values: newValues});
    }
}
