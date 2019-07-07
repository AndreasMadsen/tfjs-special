
import * as tfc from '@tensorflow/tfjs-core';
import { assertAndGetBroadcastShape } from '../broadcast';
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
        const save = args.pop() as SaveFunc<S>;
        const inputs = args as I;
        return {
            value: forwardFunc(inputs, save),
            gradFunc: backwardFunc
        };
    });
    return op(...inputs);
}

export function reduceGradient<
    G extends tfc.Tensor[],
    I extends number[][]
>(grad: G, inputShapes: I): G {
    const outShape = assertAndGetBroadcastShape(
        ...inputShapes
    );

    return grad.map(function reduce(grad, index) {
        const inputShape = inputShapes[index];

        if (grad === null) {
            return tfc.zeros(inputShape);
        }

        const reduceAxes = tfc.backend_util
            .getReductionAxes(inputShape, outShape);
        if (reduceAxes.length > 0) {
            grad = grad.sum(reduceAxes).reshape(inputShape);
        }

        return grad;
    }) as G;
}

// Simplified version of convertToTensor from
// @tensorflow/tfjs-core/src/tensor_util_env.ts
// Idealy convertToTensor would just be exported, but it isn't.
export function convertToFloatTensor<T extends tfc.Tensor>(
    x: T | tfc.TensorLike, argName: string, functionName: string
): T {
    const inferredDtype = x instanceof tfc.Tensor ?
        x.dtype : tfc.util.inferDtype(x);
    if (inferredDtype !== 'float32') {
        throw new Error(
            `Argument '${argName}' passed to '${functionName}' must be a ` +
            `Tensor or TensorLike, with float32 as the dtype ` +
            `but got dtype '${inferredDtype}'`);
    }

    if (x instanceof tfc.Tensor) {
        return x;
    }

    return tfc.Tensor.make(
        inferShape(x),
        {
            values: tfc.util.toTypedArray(
                x, 'float32', tfc.ENV.getBool('DEBUG')
            ) as Float32Array
        },
        'float32'
    );
}

function inferShape(val: tfc.TensorLike): number[] {
    if (tfc.util.isTypedArray(val)) {
        return [val.length];
    }
    if (!Array.isArray(val)) {
        return [];
    }
    const shape: number[] = [];

    let firstElem: typeof val = val;
    while (Array.isArray(firstElem) || tfc.util.isTypedArray(firstElem)) {
        shape.push(firstElem.length);
        firstElem = firstElem[0];
    }

    return shape;
}
