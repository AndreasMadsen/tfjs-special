
import * as tfc from '@tensorflow/tfjs-core';

import { CPUEvaluator } from './cpu';
import { WebGLEvaluator } from './webgl';

import { WebGLVersion } from '../defintions';

const defaultWebGLVersion = tfc.ENV.getNumber('WEBGL_VERSION') as WebGLVersion;

export function compile(
    fnname: string,
    webGLVersion: WebGLVersion = defaultWebGLVersion
) {
    const evaluator = webGLVersion > 0 ? WebGLEvaluator : CPUEvaluator;
    return new evaluator(fnname, webGLVersion);
}
