
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient, convertToFloatTensor } from './_define_op';

/**
 * Compute the Hurwitz zeta function element-wise.
 * Defined as:
 *
 * $$
 * \mathrm{zeta}(x) = \Zeta(x, q) = \sum_{0}^{\infty} \frac{1}{(q + n)^x}
 * $$
 *
 * ```js
 * const x = tf.tensor2d([2, 3, 4, 5], [4, 1]);
 * const q = tf.tensor2d([1, 2, 3, 4], [1, 4]);
 *
 * tfspecial.zeta(x, q).print();
 * ```
 *
 * @param x Input tensor, must be greater than 1. Supports broadcasting.
 * @param q Input tensor, must be a positive integer. Supports broadcasting.
 *
 * @public
 * @category Zeta
 * @order 1
 */
export function zeta(
    x: tfc.Tensor | tfc.TensorLike, q: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
    const zetaKernel = compile('zetaf');
    return runKernel(
        function forwardFunc([x, q], save) {
            save([x, q]);
            return zetaKernel.run(x, q);
        },
        function backwardPass(
            dy, [x, q]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                null,
                dy.mul(
                    zeta(x.add(1), q).mul(x).neg()
                )
            ], [x.shape, q.shape]);
        },
        [
            convertToFloatTensor(x, 'x', 'zeta'),
            convertToFloatTensor(q, 'q', 'zeta')
        ]
    );
}
