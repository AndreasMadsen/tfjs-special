
import * as tfc from '@tensorflow/tfjs-core';

export abstract class Evaluator {
    name: string;

    constructor(fnmame: string) {
        this.name = fnmame;
    }

    abstract run(...inputs: tfc.Tensor[]): tfc.Tensor;
    abstract runUnary<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R>;
}
