
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient } from './_define_op';
import { digamma } from './gamma';

export function beta(a: tfc.Tensor, b: tfc.Tensor): tfc.Tensor {
    const betaKernel = compile('betaf');
    return runKernel(
        function forwardFunc([a, b], save) {
            save([a, b]);
            return betaKernel.run(a, b);
        },
        function backwardPass(
            dy, [a, b]: tfc.Tensor[]
        ): tfc.Tensor[] {
            return reduceGradient([
                dy.mul(
                    (digamma(a).sub(digamma(a.add(b)))).mul(beta(a, b))
                ),
                dy.mul(
                    (digamma(b).sub(digamma(a.add(b)))).mul(beta(a, b))
                )
            ], [a.shape, b.shape]);
        },
        [a, b]
    );
}

export function betainc(a: tfc.Tensor, b: tfc.Tensor, x: tfc.Tensor): tfc.Tensor {
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
        [a, b, x]
    );
}
