
import { FuncCall, FileAST, FuncDecl, FuncDef, Decl } from '../ast';

const cephes2webgl = new Map([
    ['sinf', 'sin'],
    ['cosf', 'cos'],
    ['tanf', 'tan'],
    ['asinf', 'asin'],
    ['acosf', 'acos'],
    ['atanf', 'atan'],
    ['atan2f', 'atan2'],
    ['powf', 'pow'],
    ['expf', 'exp'],
    ['exp2f', 'exp2'],
    ['logf', 'log'],
    ['log2f', 'log2'],
    ['sqrtf', 'sqrt'],
    ['floorf', 'floor'],
    ['ceilf', 'ceil']
]);

export function useBuiltinMath(ast: FileAST): FileAST {
    ast.ext = ast.ext.filter(function filter(child: Decl | FuncDef): boolean {
        // Rename function prototypes
        if (child instanceof Decl && child.type instanceof FuncDecl) {
            if (cephes2webgl.has(child.name)) {
                child.name = cephes2webgl.get(child.name);
            }
            return true;
        }
        // Remove function defintions functions
        else if (child instanceof FuncDef) {
            return !cephes2webgl.has(child.decl.name);
        }
        else {
            return true;
        }
    });

    return ast.transformChildren(function transform(child) {
        if (child instanceof FuncCall) {
            // Call WebGL functions instead of cepres functions
            if (cephes2webgl.has(child.name.name)) {
                child.name.name = cephes2webgl.get(child.name.name);
            }
        } else {
            child.transformChildren(transform);
        }

        return child;
    });
}
