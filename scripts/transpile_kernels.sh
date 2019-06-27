CEPHESDIR=deps/cephes
KERNELDIR=src/kernels

# Transpile all files
for f in $CEPHESDIR/*.json
do
  echo "transpiling $f"
  ./node_modules/.bin/ts-node src/transpiler/build_kernel.ts $f "$KERNELDIR/$(basename "$f" .json).ts"
done

echo "building index"
./node_modules/.bin/ts-node src/transpiler/build_index.ts
