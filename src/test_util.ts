
export { expectArraysClose, expectArraysEqual } from '@tensorflow/tfjs-core/dist/test_util';
import '@tensorflow/tfjs-core/dist/backends/webgl/backend_webgl_test_registry';
import '@tensorflow/tfjs-core/dist/backends/cpu/backend_cpu_test_registry';
import { ALL_ENVS, describeWithFlags, TestEnv } from '@tensorflow/tfjs-core/dist/jasmine_util';

export function describeAllEnvs (name: string, fn: (env: TestEnv) => void) {
    return describeWithFlags(name, ALL_ENVS, fn);
}