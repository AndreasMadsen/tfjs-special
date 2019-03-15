
import { For, BlockInterface, Decl, ID } from '../ast';

export function makeStaticFor(incrementerName: string, maxIter: number,
                              compound: BlockInterface): For {
    const incrementer = new ID({
        _nodetype: 'ID',
        coord: 'transform/_make-static_for.ts',
        name: incrementerName
    });

    const initDecl = new Decl({
        _nodetype: 'Decl',
        coord: 'transform/_make-static_for.ts',
        bitsize: null,
        funcspec: [],
        init: {
            _nodetype: 'Constant',
            coord: 'transform/_make-static_for.ts',
            value: '0',
            type: 'int'
        },
        name: incrementerName,
        quals: [],
        storage: [],
        type: {
            _nodetype: 'TypeDecl',
            coord: 'transform/_make-static_for.ts',
            declname: incrementerName,
            quals: [],
            type: {
                _nodetype: 'IdentifierType',
                coord: 'transform/_make-static_for.ts',
                names: ['int']
            }
        }
    });

    return new For({
        _nodetype: 'For',
        coord: 'transform/_make-static_for.ts',
        init: initDecl,
        cond: {
            _nodetype: 'BinaryOp',
            coord: 'transform/_make-static_for.ts',
            left: incrementer,
            op: '<',
            right: {
                _nodetype: 'Constant',
                coord: 'transform/_make-static_for.ts',
                value: maxIter.toString(),
                type: 'int'
            }
        },
        next: {
            _nodetype: 'UnaryOp',
            coord: 'transform/_make-static_for.ts',
            expr: incrementer,
            op: 'p++'
        },
        stmt: compound
    });
}
