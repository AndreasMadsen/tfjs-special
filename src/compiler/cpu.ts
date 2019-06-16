
import * as tfc from '@tensorflow/tfjs-core';

import { linker } from '../linker';
import { Evaluator } from './abstract';
import { broadcastedOp } from './broadcast';

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
}
