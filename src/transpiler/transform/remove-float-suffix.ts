
import { FileAST, Constant, Node } from '../ast';

function formatAsFloat(num: string) {
    if (num.indexOf('.') !== -1) {
        return num;
    }
    return num + '.0';
}

export function removeFloatSuffix(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node>(child: T): T {
            if (child instanceof Constant) {
                if (child.type === 'float' && child.value.slice(-1) === 'f') {
                    return new Constant({
                        _nodetype: 'Constant',
                        coord: child.coord,
                        type: child.type,
                        value: formatAsFloat(child.value.slice(0, -1))
                    }) as Node as T;
                }
            }

            return child.transformChildren(transform);
        }
    );
}
