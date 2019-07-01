
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { beta, betainc } from './beta';

describeAllEnvs('beta', () => {
    it('beta(a, b) is correct', async () => {
        const a = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const b = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        expectArraysClose(
            await beta(a, b).array(),
            [[1,   1/2,  1/3,  1/4],
             [1/2, 1/6,  1/12, 1/20],
             [1/3, 1/12, 1/30, 1/60],
             [1/4, 1/20, 1/60, 1/140]]
        );
    });

    it('beta\'(a, b) is correct', async () => {
        const a = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const b = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        const betadx = tfc.grads((a, b) => beta(a, b).sum());
        const [betada, betadb] = betadx([a, b]);
        expectArraysClose(
            await betada.array(),
            [[-415/144], [-163/300], [-121/600], [-4441/44100]]
        );
        expectArraysClose(
            await betadb.array(),
            [[-415/144, -163/300, -121/600, -4441/44100]]
        );
    });

    it('beta\'\'(a, b) is correct', async () => {
        const a = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const b = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        const betada = tfc.grad((a) => beta(a, b).sum());
        const betadada = tfc.grad((a) => betada(a));
        const betadb = tfc.grad((b) => beta(a, b).sum());
        const betadbdb = tfc.grad((b) => betadb(b));
        expectArraysClose(
             await betadada(a).array(),
             [[5845/864], [5981/9000], [8831/54000], [557569/9261000]]
        );
        expectArraysClose(
             await betadbdb(b).array(),
             [[5845/864, 5981/9000, 8831/54000, 557569/9261000]]
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
        const a = tfc.tensor2d([1, 2, 3, 4], [1, 4]);
        const b = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const betada = tfc.grad((a) => beta(a, b).sum());
        const betadada = tfc.grad((a) => betada(a));
        const betadb = tfc.grad((b) => beta(a, b).sum());
        const betadbdb = tfc.grad((b) => betadb(b));
        expectArraysClose(
             await betadada(a).array(),
             [[5845/864, 5981/9000, 8831/54000, 557569/9261000]]
        );
        expectArraysClose(
             await betadbdb(b).array(),
             [[5845/864], [5981/9000], [8831/54000], [557569/9261000]]
        );
    });
});
