
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { erf, erfc } from './erf';

describeAllEnvs('erf', () => {
    it('erf(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await erf(x).data(),
            [-0.9999999846, -0.9999779095,
             -0.9953222650, -0.8427007929,
             0.,
             0.8427007929, 0.9953222650,
             0.9999779095, 0.9999999846]);
    });
    it('erf\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        const erfdx = tfc.grad((x) => erf(x));
        expectArraysClose(
            await erfdx(x).data(),
            [1.269823467e-7, 0.0001392530519,
             0.02066698536, 0.4151074974,
             1.128379167,
             0.4151074974, 0.02066698536,
             0.0001392530519, 1.269823467e-7]);
    });
    it('erf\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        const erfdx = tfc.grad((x) => erf(x));
        const erfdxx = tfc.grad((x) => erfdx(x));
        expectArraysClose(
            await erfdxx(x).data(),
            [1.015858773e-6, 0.0008355183116,
             0.08266794144, 0.8302149948,
             0.,
             -0.8302149948, -0.08266794144,
             -0.0008355183116, -1.015858773e-6]);
    });
});

describeAllEnvs('erfc', () => {
    it('erfc(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await erfc(x).data(),
            [1.999999985, 1.999977910,
             1.995322265, 1.842700793,
             1.,
             0.1572992070, 0.004677734981,
             0.00002209049700, 1.541725790e-8]);
    });
    it('erfc\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        const erfcdx = tfc.grad((x) => erfc(x));
        expectArraysClose(
            await erfcdx(x).data(),
            [-1.269823467e-7, -0.0001392530519,
             -0.02066698536, -0.4151074974,
             -1.128379167,
             -0.4151074974, -0.02066698536,
             -0.0001392530519, -1.269823467e-7]);
    });
    it('erfc\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        const erfcdx = tfc.grad((x) => erfc(x));
        const erfcdxx = tfc.grad((x) => erfcdx(x));
        expectArraysClose(
            await erfcdxx(x).data(),
            [-1.015858773e-6, -0.0008355183116,
             -0.08266794144, -0.8302149948,
             0.,
             0.8302149948, 0.08266794144,
             0.0008355183116, 1.015858773e-6]);
    });
});
