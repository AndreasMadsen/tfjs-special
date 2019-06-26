
import * as tfc from '@tensorflow/tfjs-core';

import { Evaluator } from './abstract';
import { CPUEvaluator } from './cpu';
import { WebGLEvaluator } from './webgl';

import { WebGLVersion } from '../defintions';

const cache = [
    new Map<string, Evaluator>(),
    new Map<string, Evaluator>(),
    new Map<string, Evaluator>()
];

export function compile(
    fnname: string,
    webGLVersion: 0 | 1 | 2 = null
) {
    if (webGLVersion === null) {
        webGLVersion = tfc.getBackend() === 'cpu'
            ? 0
            : tfc.ENV.getNumber('WEBGL_VERSION') as WebGLVersion;
    }

    let kernel = cache[webGLVersion].get(fnname);

    if (kernel === undefined) {
        if (webGLVersion > 0) {
            kernel = new WebGLEvaluator(fnname, webGLVersion as WebGLVersion);
        } else {
            kernel = new CPUEvaluator(fnname);
        }
        cache[webGLVersion].set(fnname, kernel);
    }

    return kernel;
}
