
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient, convertToFloatTensor } from './_define_op';
import { lgamma, digamma } from './gamma';

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
