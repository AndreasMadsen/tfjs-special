
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { lgamma, digamma, polygamma } from './gamma';

const EULER = 0.5772156649;
const PISQD6 = Math.PI**2/6;
const PIP4D15 = Math.PI**4/15;
const PiP6D63 = Math.PI**6/63;
const ZETA3 = 1.202056903;
const ZETA5 = 1.036927755;

describeAllEnvs('lgamma', () => {
    it('gamma(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);

        expectArraysClose(
            await lgamma(x).data(),
            [0, 0, Math.log(2), Math.log(6)]);
    });
    it('gamma\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const lgammadx = tfc.grad((x) => lgamma(x));

        expectArraysClose(
            await lgammadx(x).data(),
            [-EULER, 1 - EULER, 3/2 - EULER, 11/6 - EULER]);
    });
    it('gamma\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const lgammadx = tfc.grad((x) => lgamma(x));
        const lgammadxx = tfc.grad((x) => lgammadx(x));

        expectArraysClose(
            await lgammadxx(x).data(),
            [PISQD6, -1 + PISQD6, -5/4 + PISQD6, -49/36 + PISQD6]);
    });
    it('gamma\'\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const lgammadx = tfc.grad((x) => lgamma(x));
        const lgammadxx = tfc.grad((x) => lgammadx(x));
        const lgammadxxx = tfc.grad((x) => lgammadxx(x));

        expectArraysClose(
            await lgammadxxx(x).data(),
            [-2*ZETA3, 2 - 2*ZETA3, 9/4 - 2*ZETA3, 251/108 - 2*ZETA3]);
    });
});

describeAllEnvs('digamma', () => {
    it('digamma(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);

        expectArraysClose(
            await digamma(x).data(),
            [-EULER, 1 - EULER, 3/2 - EULER, 11/6 - EULER]);
    });
    it('digamma\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const digammadx = tfc.grad((x) => digamma(x));

        expectArraysClose(
            await digammadx(x).data(),
            [PISQD6, -1 + PISQD6, -5/4 + PISQD6, -49/36 + PISQD6]);
    });
    it('digamma\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([1,2,3,4]);
        const digammadx = tfc.grad((x) => digamma(x));
        const digammadxx = tfc.grad((x) => digammadx(x));

        expectArraysClose(
            await digammadxx(x).data(),
            [-2*ZETA3, 2 - 2*ZETA3, 9/4 - 2*ZETA3, 251/108 - 2*ZETA3]);
    });
});

describeAllEnvs('polygamma', () => {
    it('polygamma(m, x) is correct', async () => {
        const m = tfc.tensor2d([0, 1, 2, 3], [1, 4]);
        const x = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        expectArraysClose(
            await polygamma(m, x).array(),
            [[-EULER, PISQD6, -2*ZETA3, PIP4D15], // x = 1
             [1 - EULER, -1 + PISQD6, 2 - 2*ZETA3, -6 + PIP4D15], // x = 2
             [3/2 - EULER, -5/4 + PISQD6, 9/4 - 2*ZETA3, -51/8 + PIP4D15],
             [11/6 - EULER, -49/36 + PISQD6,
              251/108 - 2*ZETA3, -1393/216 + PIP4D15]]
        );
    });

    it('polygamma\'(m, x) is correct', async () => {
        const m = tfc.tensor2d([0, 1, 2, 3], [1, 4]);
        const x = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const polygammadx = tfc.grad((x) => polygamma(m, x).sum());

        expectArraysClose(
            await polygammadx(x).array(),
            [
                [PISQD6 - 2*ZETA3 + PIP4D15 - 24*ZETA5],
                [19 + PISQD6 - 2*ZETA3 + PIP4D15 - 24*ZETA5],
                [155/8 + PISQD6 - 2*ZETA3 + PIP4D15 - 24*ZETA5],
                [12547/648 + PISQD6 - 2*ZETA3 + PIP4D15 - 24*ZETA5]
            ]
        );
    });

    it('polygamma\'\'(m, x) is correct', async () => {
        const m = tfc.tensor2d([0, 1, 2, 3], [1, 4]);
        const x = tfc.tensor2d([1, 2, 3, 4], [4, 1]);
        const polygammadx = tfc.grad((x) => polygamma(m, x).sum());
        const polygammadxx = tfc.grad((x) => polygammadx(x));

        expectArraysClose(
            await polygammadxx(x).array(),
            [
                [-2*ZETA3 + PIP4D15 - 24*ZETA5 + 8*PiP6D63],
                [-100 - 2*ZETA3 + PIP4D15 - 24*ZETA5 + 8*PiP6D63],
                [-405/4 - 2*ZETA3 + PIP4D15 - 24*ZETA5 + 8*PiP6D63],
                [-98479/972 - 2*ZETA3 + PIP4D15 - 24*ZETA5 + 8*PiP6D63]
            ]
        );
    });
});
