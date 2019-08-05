
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient, convertToFloatTensor } from './_define_op';

/**
 * Computes the log of the $\Gamma(x)$ element-wise.
 * Defined as:
 *
 * $$
 * \begin{aligned}
 * \mathrm{lgamma}(x) &= \ln(|\Gamma(x)|) \\
 * \Gamma(x) &= \int_{0}^{\infty} x^{z-1} e^{-x}\,dx
 * \end{aligned}
 * $$
 *
 * ```js
 * const x = tf.tensor1d([1, 2, 3, 4]);
 *
 * tfspecial.lgamma(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Gamma
 * @order 1
 */
export function lgamma<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const lgamKernel = compile('lgamf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return lgamKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(digamma(x))];
        },
        [
            convertToFloatTensor(x, 'x', 'lgamma')
        ]
    ) as T;
}

/**
 * First order derivative of $\ln(|\Gamma(x)|)$ element-wise.
 * Defined as:
 *
 * $$
 * \mathrm{digamma}(x) = \psi(x) = \frac{d}{dx}\ln(|\Gamma(x)|)
 * $$
 *
 * ```js
 * const x = tf.tensor1d([1, 2, 3, 4]);
 *
 * tfspecial.digamma(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Gamma
 * @order 2
 */
export function digamma<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const digammaKernel = compile('psif');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return digammaKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(fast_polygamma_positive_scalar_order(1, x))];
        },
        [
            convertToFloatTensor(x, 'x', 'digamma')
        ]
    ) as T;
}

/**
 * `m + 1` order derivative of $\ln(|\Gamma(x)|)$ element-wise.
 * Defined as:
 *
 * $$
 * \mathrm{polygamma}(m, x) = \psi^{(m)}(x)
 *  = \frac{d^{m+1}}{dx^{m+1}}\ln(|\Gamma(x)|)
 * $$
 *
 * ```js
 * const m = tf.tensor2d([0, 1, 2, 3], [1, 4]);
 * const x = tf.tensor2d([1, 2, 3, 4], [4, 1]);
 *
 * tfspecial.polygamma(m, x).print();
 * ```
 *
 * @param m The derivative order of $\psi(x)$. A Tensor, ofnon-negative
 *          integer values. Supports broadcasting.
 * @param x The input tensor to $\psi(x)$. Supports broadcasting.
 *
 * @public
 * @category Gamma
 * @order 3
 */
export function polygamma(
    m: tfc.Tensor | tfc.TensorLike, x: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
    const digammaKernel = compile('psif');
    const gammaKernel = compile('gammaf');
    const zetaKernel = compile('zetaf');
    return runKernel(
        function forwardFunc([m, x], save) {
            save([m, x]);
            const mequal0 = digammaKernel.runUnary(x)
                .mul(tfc.onesLike(m));

            // The polygamma function can be expressed as:
            // psi^{(m)}(x) = (-1)^(m+1) * m! * zeta(m+1, x)
            // See: https://en.wikipedia.org/wiki/Polygamma_function
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
        [
            convertToFloatTensor(m, 'm', 'polygamma'),
            convertToFloatTensor(x, 'x', 'polygamma')
        ]
    );
}

// Assumes number is a scalar above 0, this avoids computing both
// psi and zeta.
function fast_polygamma_positive_scalar_order<T extends tfc.Tensor>(
    order: number /* > 0 */, x: T
): T {
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
            dy, [x]: T[]
        ): T[] {
            return [
                dy.mul(fast_polygamma_positive_scalar_order(order + 1, x))
            ];
        },
        [x]
    ) as T;
}

/**
 * The lower regularized incomplete Gamma function.
 * Defined as:
 *
 * $$
 * \begin{aligned}
 * \mathrm{igamma}(a, x) &= \frac{\gamma(a, x)}{\Gamma(a)} \\
 * \gamma(a, x) &= \int_{0}^{x} t^{s-1} e^{-t}\,dt
 * \end{aligned}
 * $$
 *
 * ```js
 * const a = tf.tensor2d([1, 2, 3, 4], [4, 1]);
 * const x = tf.tensor2d([1, 2, 5, 10], [1, 4]);
 *
 * tfspecial.igamma(a, x).print();
 * ```
 *
 * @param a The Gamma term tensor. Supports broadcasting.
 * @param x The incomplete integral limit. Supports broadcasting.
 *
 * @public
 * @category Gamma
 * @order 4
 */
export function igamma(
    a: tfc.Tensor | tfc.TensorLike, x: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
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
        [
            convertToFloatTensor(a, 'a', 'igamma'),
            convertToFloatTensor(x, 'x', 'igamma')
        ]
    );
}

/**
 * The upper regularized incomplete Gamma function.
 * Defined as:
 *
 * $$
 * \begin{aligned}
 * \mathrm{igammac}(a, x) &= \frac{\Gamma(a, x)}{\Gamma(a)} \\
 * \Gamma(a, x) &= \int_{x}^{\infty} t^{s-1} e^{-t}\,dt
 * \end{aligned}
 * $$
 *
 * ```js
 * const a = tf.tensor2d([1, 2, 3, 4], [4, 1]);
 * const x = tf.tensor2d([1, 2, 5, 10], [1, 4]);
 *
 * tfspecial.igammac(x).print();
 * ```
 *
 * @param a The Gamma term tensor. Supports broadcasting.
 * @param x The incomplete integral limit. Supports broadcasting.
 *
 * @public
 * @category Gamma
 * @order 5
 */
export function igammac(
    a: tfc.Tensor | tfc.TensorLike, x: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
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
        [
            convertToFloatTensor(a, 'a', 'igammac'),
            convertToFloatTensor(x, 'x', 'igammac')
        ]
    );
}

function gamma<T extends tfc.Tensor>(x: T): T {
    const gammaKernel = compile('gammaf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return gammaKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                gamma(x).mul(digamma(x))
            )];
        },
        [x]
    ) as T;
}
