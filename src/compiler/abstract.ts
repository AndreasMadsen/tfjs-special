
import * as tfc from '@tensorflow/tfjs-core';

export abstract class Evaluator {
    name: string;

    constructor(fnmame: string) {
        this.name = fnmame;
    }

    abstract run(...inputs: tfc.Tensor[]): tfc.Tensor;
}
