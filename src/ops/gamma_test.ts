
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { gamma, digamma } from './gamma';

describeAllEnvs('gamma', () => {
    it('gamma(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        expectArraysClose(
            await gamma(x).data(),
            [1, 1, 2, 6]);
    });
    it('gamma\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const gammadx = tfc.grad((x) => gamma(x));
        expectArraysClose(
            await gammadx(x).data(),
            [-0.5772156649, 0.4227843351, 1.845568670, 7.536706011]);
    });
    it('gamma\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const gammadx = tfc.grad((x) => gamma(x));
        const gammadxx = tfc.grad((x) => gammadx(x));
        expectArraysClose(
            await gammadxx(x).data(),
            [1.978111992, 0.8236806620, 2.492929992, 11.16992731]);
    });
    it('gamma\'\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const gammadx = tfc.grad((x) => gamma(x));
        const gammadxx = tfc.grad((x) => gammadx(x));
        const gammadxxx = tfc.grad((x) => gammadxx(x));
        expectArraysClose(
            await gammadxxx(x).data(),
            [-5.444874457, 0.4894615172, 3.449965020, 17.82868503]);
    });
});

describeAllEnvs('digamma', () => {
    it('digamma(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        expectArraysClose(
            await digamma(x).data(),
            [-0.5772156649, 0.4227843351, 0.9227843351, 1.256117668]);
    });
    it('digamma\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const digammadx = tfc.grad((x) => digamma(x));
        expectArraysClose(
            await digammadx(x).data(),
            [1.644934068, 0.644934068, 0.394934068, 0.283822957]);
    });
    it('digamma\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const digammadx = tfc.grad((x) => digamma(x));
        const digammadxx = tfc.grad((x) => digammadx(x));
        expectArraysClose(
            await digammadxx(x).data(),
            [-2.404113806, -0.404113806, -0.154113806, -0.080039732]);
    });
    it('digamma\'\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const digammadx = tfc.grad((x) => digamma(x));
        const digammadxx = tfc.grad((x) => digammadx(x));
        const digammadxxx = tfc.grad((x) => digammadxx(x));
        expectArraysClose(
            await digammadxxx(x).data(),
            [6.493939406, 0.493939406, 0.118939406, 0.044865332]);
    });
});
