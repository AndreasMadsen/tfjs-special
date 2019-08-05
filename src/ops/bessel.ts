
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, convertToFloatTensor } from './_define_op';

/**
 * Computes the modified Bessel function of order zero.
 * Defined as:
 *
 * $$
 * \mathrm{i0}(x) = J_0(i x) =
 *   \sum_{m=0}^\infty
 *     \frac{1}{m! \Gamma(m+1)} \left(\frac{x}{2}\right)^{2m}
 * $$
 *
 * ```js
 * const x = tf.tensor1d([0, 1, 2, 3, 4]);
 *
 * tfspecial.i0(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Bessel
 * @order 1
 */
export function i0<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const i0fKernel = compile('i0f');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return i0fKernel.runUnary(x);
        },
        // i0'(x) = i1(x)
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                i1(x)
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'i0')
        ]
    ) as T;
}

/**
 * Computes the modified Bessel function of order one.
 * Defined as:
 *
 * $$
 * \mathrm{i1}(x) = J_1(i x) =
 *   \sum_{m=0}^\infty
 *     \frac{1}{m! \Gamma(m+2)} \left(\frac{x}{2}\right)^{2m+1}
 * $$
 *
 * ```js
 * const x = tf.tensor1d([0, 1, 2, 3, 4]);
 *
 * tfspecial.i1(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Bessel
 * @order 2
 */
export function i1<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const i1fKernel = compile('i1f');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return i1fKernel.runUnary(x);
        },
        // i1'(x) = 1/2 * (i0(x) + i2(x))
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                i0(x).add(iv(2, x)).mul(0.5)
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'i1')
        ]
    ) as T;
}

function iv<T extends tfc.Tensor>(
  order: number /* >= 1 */, x: tfc.Tensor
): tfc.Tensor {
    if (order === 1) {
      return i1(x);
    }

    const ivfKernel = compile('ivf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return ivfKernel.run(tfc.scalar(order), x);
        },
        // i2'(x) = 1/2 * (i1(x) + i3(x))
        // i3'(x) = 1/2 * (i2(x) + i4(x))
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                iv(order - 1, x).add(iv(order + 1, x)).mul(0.5)
            )];
        },
        [x]
    ) as T;
}

/**
 * Computes the modified Bessel function of order zero, exponentially scaled.
 * Defined as:
 *
 * $$
 * \mathrm{i0e}(x) = \mathrm{e}^{-|x|} J_0(i x) =
 *   \mathrm{e}^{-|x|} \sum_{m=0}^\infty
 *     \frac{1}{m! \Gamma(m+1)} \left(\frac{x}{2}\right)^{2m}
 * $$
 *
 * ```js
 * const x = tf.tensor1d([0, 1, 2, 3, 4]);
 *
 * tfspecial.i0e(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Bessel
 * @order 3
 */
export function i0e<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const i0efKernel = compile('i0ef');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return i0efKernel.runUnary(x);
        },
        // i0e'(x) = sign(x) (i0e(abs(x)) - i1e(abs(x)))
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                (i0e(tfc.abs(x))
                    .sub(i1e(tfc.abs(x)))
                ).mul(tfc.sign(x)).neg()
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'i0e')
        ]
    ) as T;
}

/**
 * Computes the modified Bessel function of order one, exponentially scaled.
 * Defined as:
 *
 * $$
 * \mathrm{i1e}(x) = \mathrm{e}^{-|x|} J_1(i x) =
 *   \mathrm{e}^{-|x|} \sum_{m=0}^\infty
 *     \frac{1}{m! \Gamma(m+2)} \left(\frac{x}{2}\right)^{2m+1}
 * $$
 *
 * ```js
 * const x = tf.tensor1d([0, 1, 2, 3, 4]);
 *
 * tfspecial.i0e(x).print();
 * ```
 *
 * @param x The input tensor.
 *
 * @public
 * @category Bessel
 * @order 4
 */
export function i1e<T extends tfc.Tensor>(x: T | tfc.TensorLike): T {
    const i1efKernel = compile('i1ef');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return i1efKernel.runUnary(x);
        },
        // i1e'(x) = 1/2 * (i0e(abs(x)) - 2 * i1e(abs(x)) + i2e(abs(x)))
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            return [dy.mul(
                (i0e(tfc.abs(x))
                    .sub(i1e(tfc.abs(x)).mul(2))
                    .add(ive(2, tfc.abs(x)))
                ).mul(0.5)
            )];
        },
        [
            convertToFloatTensor(x, 'x', 'i1e')
        ]
    ) as T;
}

function ive<T extends tfc.Tensor>(
    order: number /* >= 1 */, x: T
): T {
    if (order === 1) {
        return i1e(x);
    }

    // Unforfunetly there is no special ive(v, x) function in cephes
    // Use the less numerically stable ive(v, x) = exp(-abs(x)) * iv(v, x)
    const ivfKernel = compile('ivf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return ivfKernel.run(tfc.scalar(order), x)
                .mul(tfc.exp(tfc.abs(x).neg()));
        },
        // i2e'(x) = sign(x) * 0.5 * (i1e(abs(x)) - 2*i2e(abs(x)) + i3e(abs(x)))
        // i3e'(x) = 1/2 * (i2e(abs(x)) - 2 * i3e(abs(x)) + i4e(abs(x)))
        // i4e'(x) = sign(x) * 0.5 * (i3e(abs(x)) - 2*i4e(abs(x)) + i5e(abs(x)))
        function backwardPass(
            dy, [x]: T[]
        ): T[] {
            const m = order % 2 ? tfc.sign(x).mul(0.5) : 0.5;

            return [dy.mul(
                (ive(order - 1, tfc.abs(x))
                    .sub(ive(order, tfc.abs(x)).mul(2))
                    .add(ive(order + 1, tfc.abs(x)))
                ).mul(m)
            )];
      },
      [x]
    ) as T;
}
