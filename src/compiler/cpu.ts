
import * as tfc from '@tensorflow/tfjs-core';

import { linker } from '../linker';
import { Evaluator } from './abstract';
import { broadcastedOp } from '../broadcast';

export class CPUEvaluator extends Evaluator {
    private program: (...scalars: Array<number | string>) => number;

    constructor(fnname: string) {
        super(fnname);

        const signature = linker.getSignature(fnname);
        const argumentsAsString = signature.arguments
            .map((arg) => arg.name)
            .join(', ');

        const sourceCode = `
            'strict mode';

            const NAN = Number.NaN;
            const INFINITY = Number.Infinity;

            ${linker.exportAsJS(fnname)}

            function main(${argumentsAsString}) {
                sgngamf = 0; // Reset global variables
                return ${signature.name}(${argumentsAsString});
            }

            return main;
        `;

        this.program = (new Function(sourceCode))();
    }

    run(...inputs: tfc.Tensor[]): tfc.Tensor {
        return broadcastedOp(inputs, 'float32', this.program);
    }

    runUnary<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R> {
        const inputBuffer = tfc.buffer(
            input.shape, input.dtype, input.dataSync());
        const inputData = inputBuffer.values;

        const output = tfc.buffer(input.shape, 'float32');
        const outputData = output.values;

        for (let i = 0; i < outputData.length; ++i) {
            outputData[i] = this.program(inputData[i]);
        }

        return output.toTensor();
    }
}
