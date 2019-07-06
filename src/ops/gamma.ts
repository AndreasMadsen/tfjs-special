
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient } from './_define_op';

export function lgamma<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const lgamKernel = compile('lgamf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return lgamKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(digamma(x))];
        },
        [x]
    ) as tfc.Tensor<R>;
}

export function digamma<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const digammaKernel = compile('psif');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return digammaKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(fast_polygamma_positive_scalar_order(1, x))];
        },
        [x]
    ) as tfc.Tensor<R>;
}

// The polygamma function can be expressed as:
// psi^{(m)}(x) = (-1)^(m+1) * m! * zeta(m+1, x)
// See: https://en.wikipedia.org/wiki/Polygamma_function
export function polygamma(
    m: tfc.Tensor, x: tfc.Tensor
): tfc.Tensor {
    const digammaKernel = compile('psif');
    const gammaKernel = compile('gammaf');
    const zetaKernel = compile('zetaf');
    return runKernel(
        function forwardFunc([m, x], save) {
            save([m, x]);
            const mequal0 = digammaKernel.runUnary(x)
                .mul(tfc.onesLike(m));

            const mp1 = m.add(1);
            const mabove0 = tfc.pow(-1, mp1)
                .mul(gammaKernel.runUnary(mp1))
                .mul(zetaKernel.run(mp1, x));

            return tfc.where(
                m.add(tfc.zerosLike(x)).equal(0),
                mequal0,
                mabove0
            );
        },
        function backwardPass(
            dy, [m, x]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                null,
                dy.mul(polygamma(m.add(1), x))
            ], [m.shape, x.shape]);
        },
        [m, x]
    );
}

// Assumes number is a scalar above 0, this avoids computing both
// psi and zeta.
function fast_polygamma_positive_scalar_order(
    order: number /* > 0 */, x: tfc.Tensor
): tfc.Tensor {
    const gammaKernel = compile('gammaf');
    const zetaKernel = compile('zetaf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            const mp1 = tfc.scalar(order + 1);
            return tfc.pow(-1, mp1)
                .mul(gammaKernel.runUnary(mp1))
                .mul(zetaKernel.run(mp1, x));
        },
        function backwardPass(
            dy, [x]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return [
                dy.mul(polygamma(tfc.scalar(order + 1), x))
            ];
        },
        [x]
    );
}

export function igamma(a: tfc.Tensor, x: tfc.Tensor): tfc.Tensor {
    const igamKernel = compile('igamf');
    return runKernel(
        function forwardFunc([a, x], save) {
            save([a, x]);
            return igamKernel.run(a, x);
        },
        function backwardPass(
            dy, [a, x]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                null,
                dy.mul(
                    x.neg().exp()
                        .mul(x.pow(a.sub(1)))
                        .div(gamma(a))
                )
            ], [a.shape, x.shape]);
        },
        [a, x]
    );
}

export function igammac(a: tfc.Tensor, x: tfc.Tensor): tfc.Tensor {
    const igamcKernel = compile('igamcf');
    return runKernel(
        function forwardFunc([a, x], save) {
            save([a, x]);
            return igamcKernel.run(a, x);
        },
        function backwardPass(
            dy, [a, x]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                null,
                dy.mul(
                    x.neg().exp()
                        .mul(x.pow(a.sub(1)))
                        .div(gamma(a))
                        .neg()
                )
            ], [a.shape, x.shape]);
        },
        [a, x]
    );
}

function gamma<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const gammaKernel = compile('gammaf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return gammaKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(
                gamma(x).mul(digamma(x))
            )];
        },
        [x]
    ) as tfc.Tensor<R>;
}
