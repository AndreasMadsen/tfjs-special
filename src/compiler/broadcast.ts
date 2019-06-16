
import * as tfc from '@tensorflow/tfjs-core';
import { getBroadcastDims } from './boardcast_tfjs_copy';
export { getBroadcastDims, getReductionAxes} from './boardcast_tfjs_copy';

export function assertAndGetBroadcastShape(...inShapes: number[][]): number[] {
  const outShape: number[] = [];

  // If there is only inShape, just use that as the outShape
  if (inShapes.length === 1) {
    return inShapes[0];
  }

  // Iteratively boardcast each inShape into outShape
  for (const inShape of inShapes) {
    for (let i = (inShape.length - 1),
             o = (outShape.length - 1);
         i >= 0;
         i--, o--) {
      if (o < 0) {
        // Extend shape
        outShape.unshift(inShape[i]);
      } else if (inShape[i] === 1) {
        // Keep the outShape for this index
      } else if (outShape[o] === 1) {
        // Broadcast
        outShape[o] = inShape[i];
      } else if (inShape[i] === outShape[o]) {
        // Keep the outShape for this index
      } else {
        throw createBroadcastError(...inShapes);
      }
    }
  }

  return outShape;
}

function createBroadcastError(...inShapes: number[][]): Error {
  const firstShapes = inShapes.slice(0, -1)
    .map((inShape) => JSON.stringify(inShape))
    .join(', ');
  const lastShape = JSON.stringify(inShapes[inShapes.length - 1]);

  return new Error(
    `Operands could not be broadcast together with shapes ` +
    `${firstShapes} and ${lastShape}.`
  );
}

export function broadcastedOp(
  inputs: tfc.Tensor[],
  dtype: tfc.DataType,
  op: (...scalars: Array<number | string>) => number
): tfc.Tensor {
  // get input data
  const inputsBuffer = inputs
    .map((t) => tfc.buffer(t.shape, t.dtype, t.dataSync()));
  const inputsData = inputsBuffer.map((b) => b.values);

  // create output placeholder
  const outShape = assertAndGetBroadcastShape(
    ...inputs.map((t) => t.shape)
  );
  const output = tfc.buffer(outShape, dtype);
  const outputData = output.values;

  // get dimentions which should be broadcasted
  const broadcastDims = inputs
    .map((t) => getBroadcastDims(t.shape, outShape));

  //
  for (let i = 0; i < outputData.length; ++i) {
    const outLoc = output.indexToLoc(i);

    const scalars = inputs
      .map(function getScalar(input, inputIndex) {
        const inLoc = outLoc.slice(-input.rank);
        for (const dimIndex of broadcastDims[inputIndex]) {
          inLoc[dimIndex] = 0;
        }
        const inIndex = inputsBuffer[inputIndex].locToIndex(inLoc);
        return inputsData[inputIndex][inIndex];
      });

      outputData[i] = op(...scalars);
  }

  return output.toTensor();
}
