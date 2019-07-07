
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient, convertToFloatTensor } from './_define_op';
import { digamma } from './gamma';

export function lbeta(
    a: tfc.Tensor | tfc.TensorLike, b: tfc.Tensor | tfc.TensorLike
): tfc.Tensor {
    const lgamKernel = compile('lgamf');
    return runKernel(
        function forwardFunc([a, b], save) {
            save([a, b]);
            return lgamKernel.runUnary(a)
                .add(lgamKernel.runUnary(b))
                .sub(lgamKernel.runUnary(a.add(b)));
        },
        function backwardPass(
            dy, [a, b]: tfc.Tensor[]
        ): tfc.Tensor[] {
            const digammaApB = digamma(a.add(b));

            return reduceGradient([
                dy.mul(
                    digamma(a).sub(digammaApB)
                ),
                dy.mul(
                    digamma(b).sub(digammaApB)
                )
            ], [a.shape, b.shape]);
        },
        [
            convertToFloatTensor(a, 'a', 'lbeta'),
            convertToFloatTensor(b, 'b', 'lbeta')
        ]
    );
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
