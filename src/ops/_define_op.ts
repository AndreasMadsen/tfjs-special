
import * as tfc from '@tensorflow/tfjs-core';
import '../kernels';
import '../special_kernels';

declare type SaveFunc<S extends tfc.Tensor[]> = (save: S) => void;

export function runKernel<
    T extends tfc.Tensor, I extends tfc.Tensor[], S extends tfc.Tensor[]
>(
    forwardFunc: (inputs: I, save: SaveFunc<S>) => T,
    backwardFunc: (dy: T, saved: S) => I,
    inputs: I
): T {
    const op = tfc.customGrad<T>(function f(...args) {
        const inputs = args.slice(0, -1) as I;
        const save = args[args.length - 1] as SaveFunc<S>;
        return {
            value: forwardFunc(inputs, save),
            gradFunc: backwardFunc
        };
    });
    return op(...inputs);
}
