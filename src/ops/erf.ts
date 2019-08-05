
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, convertToFloatTensor } from './_define_op';

/**
 * Computes the Gauss error function of `x` element-wise.
 * Defined as:
 *
 * $$
 * \mathrm{erf}(x) = \frac{2}{\sqrt{\pi}} \int_{0}^{x} e^{-t^{2}}\,dt
 * $$
 *
 * ```js
 * const x = tf.tensor1d([-1, 0, 1]);
 *
 * tfspecial.erf(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Error
 * @order 1
 */
export function erf<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const erffKernel = compile('erff');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return erffKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                x.square().neg().exp().mul(2 / Math.sqrt(Math.PI))
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'erf')
        ]
    ) as T;
}

/**
 * Computes the Complementary Gauss error function of `x` element-wise.
 * Defined as:
 *
 * $$
 * \mathrm{erfc}(x) = \frac{2}{\sqrt{\pi}} \int_{x}^{\infty} e^{-t^{2}}\,dt
 * $$
 *
 * ```js
 * const x = tf.tensor1d([-1, 0, 1]);
 *
 * tfspecial.erfc(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Error
 * @order 2
 */
export function erfc<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const erfcfKernel = compile('erfcf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return erfcfKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                x.square().neg().exp().mul(-2 / Math.sqrt(Math.PI))
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'erf')
        ]
    ) as T;
}
