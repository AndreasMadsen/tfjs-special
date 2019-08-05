
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient, convertToFloatTensor } from './_define_op';
import { lgamma, digamma } from './gamma';

/**
 * Computes the $\ln(|\Beta(\mathbf{x})|)$, where $\Beta(\mathbf{x})$ is the
 * multivariate beta function and $x$ is the vector along the last dimention.
 * Defined as:
 *
 * $$
 * \begin{aligned}
 * \mathrm{lbeta}(\mathbf{x}) &= \ln(|\Beta(\mathbf{x})|) \\
 * \Beta(\mathbf{x}) = \frac{\prod_{i} \Gamma(x_i)}{\Gamma(\sum_{i} x_i)}
 * \end{aligned}
 * $$
 *
 * ```js
 * const x = tf.tensor2d([[1, 1], [2, 2], [3, 3], [4, 4]]);
 *
 * tfspecial.lbeta(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Beta
 * @order 1
 */
export function lbeta(x: tfc.Tensor | tfc.TensorLike): tfc.Tensor {
    x = convertToFloatTensor(x, 'x', 'lbeta');
    if (x.rank === 0) {
        throw new TypeError(
            `x Tensor in lbeta must have rank > 0, has rank = 0`
        );
    }

    // If the last axis has size 0, return 1 like the $\prod$ of a an empty
    // sequence.
    if (x.shape[x.shape.length - 1] <= 0) {
        return tfc.ones(x.shape.slice(0, -1));
    }

    return lgamma(x).sum(-1)
        .sub(lgamma(x.sum(-1)));
}

function beta(a: tfc.Tensor, b: tfc.Tensor): tfc.Tensor {
    const betaKernel = compile('betaf');
    return runKernel(
        function forwardFunc([a, b], save) {
            save([a, b]);
            return betaKernel.run(a, b);
        },
        function backwardPass(
            dy, [a, b]: tfc.Tensor[]
        ): tfc.Tensor[] {
            const digammaApB = digamma(a.add(b));
            const betaApB = beta(a, b);

            return reduceGradient([
                dy.mul(
                    digamma(a).sub(digammaApB).mul(betaApB)
                ),
                dy.mul(
                    digamma(b).sub(digammaApB).mul(betaApB)
                )
            ], [a.shape, b.shape]);
        },
        [a, b]
    );
}

/**
 * Compute the regularized incomplete beta integral.
 * Defined as:
 *
 * $$
 * \begin{aligned}
 * \mathrm{betainc}(a, b, x) &= I_x(a, b)
 *  = \frac{\Beta(x; a, b)}{\Beta(a, b)} \\
 * \Beta(x; a, b) &= \int_{0}^{x} t^{a-1} (1-t)^{b-1}\,dt
 * \end{aligned}
 * $$
 *
 * ```js
 * const a = 1;
 * const b = 2;
 * const x = tf.tensor1d([0, 0.25, 0.5, 0.75, 1]);
 *
 * tfspecial.betainc(a, b, x).print();
 * ```
 *
 * @param a The first beta parameter. Supports boardcasting.
 * @param b The second beta parameter. Supports boardcasting.
 * @param x The incomplete integral limit. Supports broadcasting.
 *
 * @public
 * @category Beta
 * @order 2
 */
export function betainc(
    a: tfc.Tensor | tfc.TensorLike,
    b: tfc.Tensor | tfc.TensorLike,
    x: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
    const incbetKernel = compile('incbetf');

    return runKernel(
        function forwardFunc([a, b, x], save) {
            save([a, b, x]);
            return incbetKernel.run(a, b, x);
        },
        function backwardPass(
            dy, [a, b, x]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                null,
                null,
                dy.mul(
                    x.pow(a.sub(1)).mul(x.sub(1).neg().pow(b.sub(1)))
                     .div(beta(a, b))
                )
            ], [a.shape, b.shape, x.shape]);
        },
        [
            convertToFloatTensor(a, 'a', 'betainc'),
            convertToFloatTensor(b, 'b', 'betainc'),
            convertToFloatTensor(x, 'x', 'betainc')
        ]
    );
}
