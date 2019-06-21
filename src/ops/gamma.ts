
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel } from './_define_op';

export function gamma<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const gamma = compile('gammaf');
    return runKernel(
        function forwardFunc([x], save) {
            const out = gamma.runUnary(x);
            save([x, out]);
            return out;
        },
        function backwardPass(
            dy, [x, out]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(digamma(x).mul(out))];
        },
        [x]
    ) as tfc.Tensor<R>;
}

export function digamma<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const digamma = compile('psif');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return digamma.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(polygamma(1, x))];
        },
        [x]
    ) as tfc.Tensor<R>;
}

// The polygamma function can be expressed as:
// psi^{(m)}(x) = (-1)^(m+1) * m! * zeta(m+1, x)
// See: https://en.wikipedia.org/wiki/Polygamma_function
//
// This is not a part of dephes and thus not exposed directly, however it
// can be computed using tf.grad((x) => digamma(x)) and higher order gradients.
function polygamma<R extends tfc.Rank>(
    order: number, x: tfc.Tensor<R>
): tfc.Tensor<R> {
    const gamma = compile('gammaf');
    const zeta = compile('zetaf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            const mp1 = tfc.scalar(order + 1);
            return tfc.pow(-1, mp1)
                .mul(gamma.runUnary(mp1))
                .mul(zeta.run(mp1, x));
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(polygamma(order + 1, x))];
        },
        [x]
    ) as tfc.Tensor<R>;
}
