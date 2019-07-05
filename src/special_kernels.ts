import { KernelFunction, WebGLVersion } from './defintions';
import { linker } from './linker';

// Add type cast functions
linker.add(new KernelFunction({
    signature: {
        name: 'float',
        type: 'float',
        arguments: [
            {name: 'value', type: 'T', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: null,
    codeJS: `function float(value) { return value; }`,
}));

linker.add(new KernelFunction({
    dependencies: [],
    constants: [],
    variables: [],
    signature: {
        name: 'int',
        type: 'int',
        arguments: [
            {name: 'value', type: 'T', index: 0}
        ]
    },
    codeWebGL: null,
    codeJS: `function int(value) { return value | 0; }`,
}));

linker.add(new KernelFunction({
    signature: {
        name: 'bool',
        type: 'bool',
        arguments: [
            {name: 'value', type: 'T', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: null,
    codeJS: `function bool(value) { return (value !== 0); }`,
}));

// Add bultin math functions
for (const name of ['sin', 'cos', 'tan', 'asin', 'acos', 'atan',
                    'exp', 'log', 'log2', 'sqrt',
                    'floor', 'ceil']) {
    linker.add(new KernelFunction({
        signature: {
            name,
            type: 'T',
            arguments: [
                {name: 'value', type: 'T', index: 0}
            ]
        },
        dependencies: [],
        constants: [],
        variables: [],
        codeWebGL: null,
        codeJS: `function ${name}(value) { return Math.${name}(value); }`,
    }));
}
linker.add(new KernelFunction({
    signature: {
        name: 'pow',
        type: 'float',
        arguments: [
            {name: 'x', type: 'float', index: 0},
            {name: 'n', type: 'float', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: null,
    codeJS: `function pow(x, n) { return Math.pow(x, n); }`,
}));
linker.add(new KernelFunction({
    signature: {
        name: 'atan2',
        type: 'float',
        arguments: [
            {name: 'x', type: 'float', index: 0},
            {name: 'y', type: 'float', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: `atan2(float x, float y) { return atan(x, y); }`,
    codeJS: `function atan2(x, y) { return Math.atan2(x, y); }`,
}));
linker.add(new KernelFunction({
    signature: {
        name: 'exp2',
        type: 'float',
        arguments: [
            {name: 'value', type: 'float', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: null,
    codeJS: `function exp2(value) { return Math.pow(2, value); }`,
}));

// Add replacement functions
linker.add(new (class IsOddKernelFunction extends KernelFunction {
    constructor() {
        super({
            signature: {
                name: 'is_odd',
                type: 'int',
                arguments: [
                    {name: 'value', type: 'int', index: 0}
                ]
            },
            dependencies: [],
            constants: [],
            variables: [],
            codeWebGL: `// replaced by exportAsWebGL`,
            codeJS: `function is_odd(value) { return value & 1; }`
        });
    }

    exportAsWebGL(version: WebGLVersion): string {
        if (version === 2) {
            return `int is_odd(int value) { return value & 1; }`;
        } else {
            return (
            `int is_odd(int value) {
                return int(mod(float(value), 2.0));
            }`);
        }
    }
})());

// Add error function
linker.add(new KernelFunction({
    signature: {
        name: 'mtherr',
        type: 'void',
        arguments: [
            {name: 'code', type: 'int', index: 0}
        ]
    },
    dependencies: [],
    constants: [],
    variables: [],
    codeWebGL: `void mtherr(int code) { }`,
    codeJS: `function mtherr(code) { }`,
}));

// Add array functions
for (let i = 1; i <= 20; i++) {
    linker.add(new KernelFunction({
        signature: {
            name: `chbevlf_${i}`,
            type: 'float',
            arguments: [
                {name: 'x', type: 'float', index: 0},
                {name: 'array', type: `float[${i}]`, index: 2},
                {name: 'n', type: 'int', index: 2}
            ]
        },
        dependencies: [],
        constants: [],
        variables: [],
        codeWebGL:
        `float chbevlf_${i}(float x, float array[${i}], int n) {
            float b0 = array[0];
            float b1 = 0.0;
            float b2;
            for (int i = 1; (i < ${i}); i++) {
                b2 = b1;
                b1 = b0;
                b0 = (((x * b1) - b2) + array[i]);
            }

            return (0.5 * (b0 - b2));
        }`,
        codeJS:
        `function chbevlf_${i}(x, array, n) {
            let b0 = array[0];
            let b1 = 0.0;
            let b2;
            for (let i = 1; (i < ${i}); i++) {
                b2 = b1;
                b1 = b0;
                b0 = (((x * b1) - b2) + array[i]);
            }

            return (0.5 * (b0 - b2));
        }`
    }));

    linker.add(new KernelFunction({
        signature: {
            name: `polevlf_${i}`,
            type: 'float',
            arguments: [
                {name: 'xx', type: 'float', index: 0},
                {name: 'coef', type: `float[${i}]`, index: 2},
                {name: 'N', type: 'int', index: 2}
            ]
        },
        dependencies: [],
        constants: [],
        variables: [],
        codeWebGL:
        `float polevlf_${i}(float xx, float coef[${i}], int N) {
            float ans = coef[0];
            for (int i = 1; (i <= ${i - 1}); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`,
        codeJS:
        `function polevlf_${i}(xx, coef, N) {
            let ans = coef[0];
            for (let i = 1; (i <= ${i - 1}); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`
    }));

    linker.add(new KernelFunction({
        signature: {
            name: `p1evlf_${i}`,
            type: 'float',
            arguments: [
                {name: 'xx', type: 'float', index: 0},
                {name: 'coef', type: `float[${i}]`, index: 2},
                {name: 'N', type: 'int', index: 2}
            ]
        },
        dependencies: [],
        constants: [],
        variables: [],
        codeWebGL:
        `float p1evlf_${i}(float xx, float coef[${i}], int N) {
            float ans = (xx + coef[0]);
            for (int i = 1; (i < ${i}); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`,
        codeJS: `function p1evlf_${i}(xx, coef, N) {
            let ans = (xx + coef[0]);
            for (let i = 1; (i < ${i}); i++) {
                ans = ((ans * xx) + coef[i]);
            }

            return ans;
        }`
    }));
}
