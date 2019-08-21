import nodeResolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const LICENSE = `/*
* Copyright (c) 2019, Andreas Madsen
* All rights reserved.
*
* Cephes is LICENSED with special permision under BSD.
* Copyright (c) 2019, Steven Moshier
* All rights reserved.
*
*/`;

function config({plugins = [], output = {}}) {
    return {
        input: 'src/index.ts',
        plugins: [
            typescript({
                tsconfigOverride: {compilerOptions: {module: 'ES2015'}}
            }),
            nodeResolve(),
            ...plugins
        ],
        output: {
            banner: LICENSE,
            sourcemap: true,
            globals: {
                '@tensorflow/tfjs-core': 'tf'
            },
            ...output
        },
        external: ['@tensorflow/tfjs-core']
    };
}

module.exports = function (cmdOptions) {
    const bundles = [];

    // tf-core.js
    bundles.push(config({
        plugins: [],
        output: {
            format: 'umd',
            name: 'tfspecial',
            extend: true,
            file: 'dist/tfjs-special.js',
        }
    }));

    // tf-core.min.js
    bundles.push(config({
        plugins: [terser({
            output: { preamble: LICENSE }
        })],
        output: {
            format: 'umd',
            name: 'tfspecial',
            extend: true,
            file: 'dist/tfjs-special.min.js',
        }
    }));

    // tf-core.esm.js
    bundles.push(config({
        plugins: [terser({
            output: { preamble: LICENSE }
        })],
        output: {
            format: 'es',
            file: 'dist/tfjs-special.esm.js',
        }
    }));

    return bundles;
};
