
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel } from './_define_op';

export function erf<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const erffKernel = compile('erff');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return erffKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(
                x.square().neg().exp().mul(2 / Math.sqrt(Math.PI))
            )];
        },
        [x]
    ) as tfc.Tensor<R>;
}

export function erfc<R extends tfc.Rank>(x: tfc.Tensor<R>): tfc.Tensor<R> {
    const erfcfKernel = compile('erfcf');
    return runKernel(
        function forwardFunc([x], save) {
            save([x]);
            return erfcfKernel.runUnary(x);
        },
        function backwardPass(
            dy, [x]: Array<tfc.Tensor<R>>
        ): Array<tfc.Tensor<R>> {
            return [dy.mul(
                x.square().neg().exp().mul(-2 / Math.sqrt(Math.PI))
            )];
        },
        [x]
    ) as tfc.Tensor<R>;
}
