
import * as tfc from '@tensorflow/tfjs-core';
import { describeAllEnvs, expectArraysClose } from '../test_util';
import { i0, i1, i0e, i1e } from './bessel';

describeAllEnvs('i0', () => {
    it('i0(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await i0(x).array(),
           [11.30192195, 4.880792586, 2.279585302, 1.266065878,
            1.,
            1.266065878, 2.279585302, 4.880792586, 11.30192195]
        );
    });

    it('i0\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        const i0dx = tfc.grad((x) => i0(x));
        expectArraysClose(
            await i0dx(x).array(),
            [-9.759465154, -3.953370217, -1.590636855, -0.5651591040,
             0.,
             0.5651591040, 1.590636855, 3.953370217, 9.759465154]
        );
    });

    it('i0\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i0dx = tfc.grad((x) => i0(x));
        const i0dxx = tfc.grad((x) => i0dx(x));
        expectArraysClose(
            await i0dxx(x).array(),
            [8.862055662, 3.563002514, 1.484266874, 0.7009067740,
             0.7009067740, 1.484266874, 3.563002514, 8.862055662]
        );
    });
});

describeAllEnvs('i1', () => {
    it('i1(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await i1(x).array(),
            [-9.759465154, -3.953370217, -1.590636855, -0.5651591040,
             0.,
             0.5651591040, 1.590636855, 3.953370217, 9.759465154]
        );
    });

    it('i1\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i1dx = tfc.grad((x) => i1(x));
        expectArraysClose(
            await i1dx(x).array(),
            [8.862055663, 3.563002513, 1.484266875, 0.7009067738,
             0.7009067738, 1.484266875, 3.563002513, 8.862055663]
        );
    });

    it('i1\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i1dx = tfc.grad((x) => i1(x));
        const i1dxx = tfc.grad((x) => i1dx(x));
        expectArraysClose(
            await i1dxx(x).array(),
            [-8.153917810, -3.204966070, -1.246162631, -0.4294114342,
             0.4294114342, 1.246162631, 3.204966070, 8.153917810]
        );
    });
});

describeAllEnvs('i0e', () => {
    it('i0e(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await i0e(x).array(),
            [0.2070019212, 0.2430003542, 0.3085083224, 0.4657596077,
             1.,
             0.4657596077, 0.3085083224, 0.2430003542, 0.2070019212]
        );
    });

    it('i0e\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i0edx = tfc.grad((x) => i0e(x));
        expectArraysClose(
            await i0edx(x).array(),
            [0.0282510817, 0.0461736409, 0.0932390332, 0.2578491923,
             -0.2578491923, -0.0932390332, -0.0461736409, -0.0282510817]
        );
    });

    it('i0e\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i0edx = tfc.grad((x) => i0e(x));
        const i0edxx = tfc.grad((x) => i0edx(x));
        expectArraysClose(
            await i0edxx(x).array(),
            [0.0118144535, 0.0267383774, 0.0788434217, 0.3077879693,
             0.3077879693, 0.0788434217, 0.0267383774, 0.0118144535]
        );
    });
});

describeAllEnvs('i1e', () => {
    it('i1e(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
        expectArraysClose(
            await i1e(x).array(),
            [-0.1787508395, -0.1968267133, -0.2152692892, -0.2079104154,
             0.,
             0.2079104154, 0.2152692892, 0.1968267133, 0.1787508395]
        );
    });

    it('i1e\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i1edx = tfc.grad((x) => i1e(x));
        expectArraysClose(
            await i1edx(x).array(),
            [-0.0164366282, -0.0194352636, -0.0143956113, 0.0499387769,
             0.0499387769, -0.0143956113, -0.0194352636, -0.0164366282]
        );
    });

    it('i1e\'\'(x) is correct', async () => {
        const x = tfc.tensor1d([-4, -3, -2, -1, 1, 2, 3, 4]);
        const i1edx = tfc.grad((x) => i1e(x));
        const i1edxx = tfc.grad((x) => i1edx(x));
        expectArraysClose(
            await i1edxx(x).array(),
            [-0.0034666310, -0.0016096788, 0.0178282940, 0.1498163307,
             -0.1498163307, -0.0178282940, 0.0016096788, 0.0034666310]
        );
    });
});
