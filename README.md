# TensorFlow.js Special Math

TensorFlow.js Special Math implements all the special math functions from TensorFlow, those are the Gamma, Beta, Bessel, and Error functions, as well as all the variations that TensorFlow provides.

These functions are essential in properbility distributions and for solving partial differential equations, and may other advanced mathmatical fields.

All the functions are:

* implemented in both WebGL and JavaScript.
* have defined gradients and supports tf.grad().
* are TypeScript compatible with TensorFlow.js.
* transpiled from cephes, the same library used by SciPy.

## Example

```js
const tfc = require('@tensorflow/tfjs-core');
const tfs = require('tfjs-special');

const x = tfc.tensor1d([1, 2, 3, 4]);

const gamma = (tensor) => tfs.lgamma(tensor).exp();
const gammadx = tfc.grad(gamma);
gammadx(x).print();
```

## Documentation

* Bessel
 - [`i0`](https://andreasmadsen.github.io/tfjs-special/api.html#api-i0)
 - [`i1`](https://andreasmadsen.github.io/tfjs-special/api.html#api-i1)
 - [`i0e`](https://andreasmadsen.github.io/tfjs-special/api.html#api-i0e)
 - [`i1e`](https://andreasmadsen.github.io/tfjs-special/api.html#api-i1e)
* Beta
 - [`lbeta`](https://andreasmadsen.github.io/tfjs-special/api.html#api-lbeta)
 - [`betainc`](https://andreasmadsen.github.io/tfjs-special/api.html#api-betainc)
* Error
 - [`erf`](https://andreasmadsen.github.io/tfjs-special/api.html#api-erf)
 - [`erfc`](https://andreasmadsen.github.io/tfjs-special/api.html#api-erfc)
* Gamma
 - [`lgamma`](https://andreasmadsen.github.io/tfjs-special/api.html#api-lgamma)
 - [`digamma`](https://andreasmadsen.github.io/tfjs-special/api.html#api-digamma)
 - [`polygamma`](https://andreasmadsen.github.io/tfjs-special/api.html#api-polygamma)
 - [`igamma`](https://andreasmadsen.github.io/tfjs-special/api.html#api-igamma)
 - [`igammac`](https://andreasmadsen.github.io/tfjs-special/api.html#api-igammac)
* Zeta
 - [`zeta`](https://andreasmadsen.github.io/tfjs-special/api.html#api-zeta)
