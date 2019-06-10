
import * as tfc from '@tensorflow/tfjs-core';

export abstract class Evaluator {
    name: string;

    constructor(fnmame: string) {
        this.name = fnmame;
    }

    abstract run<R extends tfc.Rank>(input: tfc.Tensor<R>): tfc.Tensor<R>;
}
