
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose, expectPromiseToFail } from '../test_util';
import { lbeta, betainc } from './beta';

describeAllEnvs('beta', () => {
    it('lbeta(x) is correct', async () => {
        const x = tfc.tensor2d([[1, 1], [2, 2], [3, 3], [4, 4]]);
        expectArraysClose(
            await lbeta(x).array(),
            [0, -Math.log(6), -Math.log(30), -Math.log(140)]
        );
    });

    it('lbeta(x) supports TensorLike', async () => {
        const x = [[1, 1], [2, 2], [3, 3], [4, 4]];
        expectArraysClose(
            await lbeta(x).array(),
            [0, -Math.log(6), -Math.log(30), -Math.log(140)]
        );
    });

    it('lbeta(x) throws for scalars', (done) => {
        const x = tfc.scalar(1);
        expectPromiseToFail(async () => lbeta(x).array(), done);
    });

    it('lbeta(x) returns ones for empty tensor', async () => {
        const x = tfc.tensor3d(new Float32Array(), [3, 5, 0]);
        expectArraysClose(
            await lbeta(x).array(),
            await tfc.ones([3, 5]).array()
        );
    });

    it('lbeta\'(x) is correct', async () => {
        const x = tfc.tensor2d([[1, 1], [2, 2], [3, 3], [4, 4]]);
        const betadx = tfc.grad((x) => lbeta(x));
        expectArraysClose(
            await betadx(x).array(),
            [-1, -5/6, -47/60, -319/420]
        );
    });

    it('lbeta\'\'(ax) is correct', async () => {
        const x = tfc.tensor2d([[1, 1], [2, 2], [3, 3], [4, 4]]);
        const betadx = tfc.grad((x) => lbeta(x));
        const betadxx = tfc.grad((x) => betadx(x));
        expectArraysClose(
             await betadxx(x).array(),
             [1, 13/36, 769/3600, 26581/176400]
        );
    });
});

describeAllEnvs('betainc', () => {
    it('betainc(a, b, x) is correct', async () => {
        const a = tfc.tensor3d([1, 2, 3, 4], [4, 1, 1]);
        const b = tfc.tensor3d([1, 2, 3, 4], [1, 4, 1]);
        const x = tfc.tensor3d([0, 0.25, 0.5, 0.75, 1], [1, 1, 5]);

        expectArraysClose(
            await betainc(a, b, x).array(),
            [
                [[0, 1/4, 1/2, 3/4, 1],
                 [0, 7/16, 3/4, 15/16, 1],
                 [0, 37/64, 7/8, 63/64, 1],
                 [0, 175/256, 15/16, 255/256, 1]],
                [[0, 1/16, 1/4, 9/16, 1],
                 [0, 5/32, 1/2, 27/32, 1],
                 [0, 67/256, 11/16, 243/256, 1],
                 [0, 47/128, 13/16, 63/64, 1]],
                [[0, 1/64, 1/8, 27/64, 1],
                 [0, 13/256, 5/16, 189/256, 1],
                 [0, 53/512, 1/2, 459/512, 1],
                 [0, 347/2048, 21/32, 1971/2048, 1]],
                [[0, 1/256, 1/16, 81/256, 1],
                 [0, 1/64, 3/16, 81/128, 1],
                 [0, 77/2048, 11/32, 1701/2048, 1],
                 [0, 289/4096, 1/2, 3807/4096, 1]]
            ]
        );
    });

    it('betainc(a, b, x) supports TensorLike', async () => {
        const a = 2;
        const b = 2;
        const x = [0, 0.25, 0.5, 0.75, 1];

        expectArraysClose(
            await betainc(a, b, x).array(),
            [0, 5/32, 1/2, 27/32, 1]
        );
    });

    it('betainc\'(a, b, x) is correct', async () => {
        const a = tfc.tensor3d([1, 2, 3, 4], [4, 1, 1]);
        const b = tfc.tensor3d([1, 2, 3, 4], [1, 4, 1]);
        const x = tfc.tensor3d([0, 0.25, 0.5, 0.75, 1], [1, 1, 5]);
        const betad = tfc.grads((a, b, x) => betainc(a, b, x).sum());
        const [betada, betadb, betadx] = betad([a, b, x]);

        expectArraysClose(
            await betada.array(),
            [[[0]], [[0]], [[0]], [[0]]]
        );
        expectArraysClose(
            await betadb.array(),
            [[[0], [0], [0], [0]]]
        );
        expectArraysClose(
            await betadx.array(),
            [[[10, 16825/1024, 325/16, 16825/1024, 10]]]
        );
    });

    it('betainc\'\'(a, b, x) is correct', async () => {
        const a = tfc.tensor3d([1, 2, 3, 4], [4, 1, 1]);
        const b = tfc.tensor3d([1, 2, 3, 4], [1, 4, 1]);
        const x = tfc.tensor3d([0, 0.25, 0.5, 0.75, 1], [1, 1, 5]);
        const betaincdx = tfc.grad((x) => betainc(a, b, x).sum());
        const betaincdxx = tfc.grad((x) => betaincdx(x));

        expectArraysClose(
             await betaincdxx(x).array(),
             [[[NaN, 3425/128, 0, -3425/128, NaN]]]
        );
    });
});
