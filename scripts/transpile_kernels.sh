echo "transpile ..."
./node_modules/.bin/ts-node src/transpiler/build_kernel.ts deps/cephes/*.json
echo "building index ..."
./node_modules/.bin/ts-node src/transpiler/build_index.ts
