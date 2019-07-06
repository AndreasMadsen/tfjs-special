
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, reduceGradient } from './_define_op';

export function zeta(x: tfc.Tensor, q: tfc.Tensor): tfc.Tensor {
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
        [x, q]
    );
}
