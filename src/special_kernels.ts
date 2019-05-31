import { KernelFunction } from './defintions';
import { linker } from './linker';

linker.add(new KernelFunction({
    name: 'mtherr',
    dependencies: [],
    constants: [],
    variables: [],
    signature: `void mtherr(int code)`,
    code: `void mtherr(int code) { }`
}));

for (let i = 1; i <= 20; i++) {
    linker.add(new KernelFunction({
        name: `chbevlf_${i}`,
        dependencies: [],
        constants: [],
        variables: [],
        signature: `float chbevlf_${i}(float x, float array[${i}], int n)`,
        code:
        `float chbevlf_${i}(float x, float array[${i}], int n) {
            float b0 = array[0];
            float b1 = 0.0;
            float b2;
            for (int i = 1; (i < n); i++) {
                b2 = b1;
                b1 = b0;
                b0 = (((x * b1) - b2) + array[i]);
            }

            return (0.5 * (b0 - b2));
        }`
    }));

    linker.add(new KernelFunction({
        name: `polevlf_${i}`,
        dependencies: [],
        constants: [],
        variables: [],
        signature: `float polevlf_${i}(float xx, float coef[${i}], int N)`,
        code:
        `float polevlf_${i}(float xx, float coef[${i}], int N) {
            float ans = coef[0];
            for (int i = 1; (i <= N); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`
    }));

    linker.add(new KernelFunction({
        name: `p1evlf_${i}`,
        dependencies: [],
        constants: [],
        variables: [],
        signature: `float p1evlf_${i}(float xx, float coef[${i}], int N)`,
        code:
        `float p1evlf_${i}(float xx, float coef[${i}], int N) {
            float ans = (xx + coef[0]);
            for (int i = 1; (i < N); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`
    }));
}
