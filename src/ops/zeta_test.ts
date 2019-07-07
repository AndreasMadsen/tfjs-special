
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { zeta } from './zeta';

describeAllEnvs('zeta', () => {
    it('zeta(z, q) is correct', async () => {
        const x = tfc.tensor2d([2, 3, 4, 5], [4, 1]);
        const q = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        expectArraysClose(
            await zeta(x, q).array(),
            [[1.644934068, 0.644934068, 0.394934068, 0.283822957],
             [1.202056903, 0.202056903, 0.077056903, 0.040019866],
             [1.082323234, 0.082323234, 0.019823234, 0.007477555],
             [1.036927755, 0.036927755, 0.005677755, 0.001562529]]
        );
    });

    it('zeta(z, q) supports TensorLike', async () => {
        const x = [2, 3, 4, 5];
        const q = [1, 2, 3, 4];
        expectArraysClose(
            await zeta(x, q).array(),
            [1.644934068, 0.202056903, 0.019823234, 0.001562529]
        );
    });

    it('zeta\'(z, q) is correct', async () => {
        if (tfc.getBackend() !== 'webgl' ||
            tfc.ENV.getNumber('WEBGL_VERSION') !== 1) {
            return;
        }

        const x = tfc.tensor2d([2, 3, 4, 5], [4, 1]);
        const q = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        const zetad = tfc.grads((x, q) => zeta(x, q).sum());
        const [zetadx, zetadq] = zetad([x, q]);
        expectArraysClose(
            await zetadx.array(),
            [[0], [0], [0], [0]]
        );
        expectArraysClose(
            await zetadq.array(),
            [[-14.88550984, -0.885509846, -0.244884846, -0.110454116]]
        );
    });

    it('zeta\'\'(z, q) is correct', async () => {
        const x = tfc.tensor2d([2, 3, 4, 5], [4, 1]);
        const q = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        const zetadq = tfc.grad((q) => zeta(x, q).sum());
        const zetadqq = tfc.grad((q) => zetadq(q));
        expectArraysClose(
             await zetadqq(q).array(),
             [[69.53441203, 1.53441203, 0.23753703, 0.07292798]]
        );
    });
});
