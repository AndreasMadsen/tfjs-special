
import * as tfc from '@tensorflow/tfjs-core';
import { compile } from '../compiler';
import { runKernel, convertToFloatTensor } from './_define_op';

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
