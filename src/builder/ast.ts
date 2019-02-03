import * as assert from 'assert';

export class Node {
    readonly _nodetype: string;
    readonly coord: string | null;

    constructor(node: Node, expectedType: string) {
        if (node._nodetype !== expectedType) {
            throw new Error(
                `unexpected type ${node._nodetype}, ` +
                `expected ${expectedType} from ${node.coord}`
            );
        }

        this._nodetype = node._nodetype;
        this.coord = node.coord;
    }
}

class Decl extends Node {
    readonly bitsize: null;
    readonly funcspec: Node[];
    readonly init: InitList | Constant | UnaryOp | null;
    readonly name: string;
    readonly quals: Node[];
    readonly storage: string[];
    readonly type: Decl | TypeDecl | FuncDecl | ArrayDecl | PtrDecl;

    constructor(json: Node) {
        const node = json as Decl;
        super(node, 'Decl');

        this.bitsize = node.bitsize;
        this.funcspec = assertEmpty(node.funcspec);

        if (node.init === null) {
            this.init = null;
        } else {
            switch (node.init._nodetype) {
                case 'InitList':
                    this.init = new InitList(node.init as Node);
                    break;
                case 'Constant':
                    this.init = new Constant(node.init as Node);
                    break;
                case 'UnaryOp':
                    this.init = new UnaryOp(node.init as Node);
                    break;
                default:
                    throw unsupportedType(node.init as Node);
            }
        }

        this.name = node.name;
        this.quals = assertEmpty(node.quals);
        this.storage = node.storage;

        switch (node.type._nodetype) {
            case 'Decl':
                this.type = new Decl(node.type as Node);
                break;
            case 'TypeDecl':
                this.type = new TypeDecl(node.type as Node);
                break;
            case 'FuncDecl':
                this.type = new FuncDecl(node.type as Node);
                break;
            case 'ArrayDecl':
                this.type = new ArrayDecl(node.type as Node);
                break;
            case 'PtrDecl':
                this.type = new PtrDecl(node.type as Node);
                break;
            default:
                throw unsupportedType(node.type as Node);
        }
    }
}

class FuncDecl extends Node {
    readonly args: ParamList | null;
    readonly type: TypeDecl;

    constructor(json: Node) {
        const node = json as FuncDecl;
        super(node, 'FuncDecl');

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ParamList(node.args as Node);
        }

        this.type = new TypeDecl(node.type as Node);
    }
}

class TypeDecl extends Node {
    readonly declname: string;
    readonly quals: Node[];
    readonly type: IdentifierType;

    constructor(json: Node) {
        const node = json as TypeDecl;
        super(node, 'TypeDecl');

        this.declname = node.declname;
        this.quals = assertEmpty(node.quals);

        switch (node.type._nodetype) {
            case 'IdentifierType':
                this.type = new IdentifierType(node.type as Node);
                break;
            case 'Union':
                this.type = new Union(node.type as Node);
                break;
            default:
                throw unsupportedType(node.type as Node);
        }
    }
}

class ArrayDecl extends Node {
    readonly dim: null;
    // tslint:disable-next-line:variable-name
    readonly dim_quals: Node[];
    readonly type: TypeDecl;

    constructor(json: Node) {
        const node = json as ArrayDecl;
        super(node, 'ArrayDecl');

        this.dim = node.dim;
        this.dim_quals = assertEmpty(node.dim_quals);
        this.type = new TypeDecl(node.type as Node);
    }
}

class PtrDecl extends Node {
    readonly quals: Node[];
    readonly type: TypeDecl;

    constructor(json: Node) {
        const node = json as PtrDecl;
        super(node, 'PtrDecl');

        this.quals = node.quals;
        this.type = new TypeDecl(node.type as Node);
    }
}

class InitList extends Node {
    exprs: Expression[];

    constructor(json: Node) {
        const node = json as InitList;
        super(node, 'InitList');

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }
}

class IdentifierType extends Node {
    readonly name: string[];

    constructor(json: Node) {
        const node = json as IdentifierType;
        super(node, 'IdentifierType');

        this.name = node.name;
    }
}

class Union extends Node {
    readonly decls: Decl[];
    readonly name: null;

    constructor(json: Node) {
        const node = json as Union;
        super(node, 'Union');

        this.decls = node.decls.map((node: Node) => new Decl(node));
        this.name = node.name;
    }
}

class FuncDef extends Node {
    readonly body: Compound;
    readonly decl: Decl;
    // tslint:disable-next-line:variable-name
    readonly param_decls: null;

    constructor(json: Node) {
        const node = json as FuncDef;
        super(node, 'FuncDef');

        this.body = new Compound(node.body as Node);
        this.decl = new Decl(node.decl as Decl);
        this.param_decls = node.param_decls;
    }
}

class Cast extends Node {
    readonly expr: Expression;
    // tslint:disable-next-line:variable-name
    readonly to_type: Typename;

    constructor(json: Node) {
        const node = json as Cast;
        super(node, 'Cast');

        this.expr = expression(node.expr as Node);
        this.to_type = new Typename(node.to_type as Node);
    }
}

class UnaryOp extends Node {
    readonly expr: Expression;
    readonly op: string;

    constructor(json: Node) {
        const node = json as UnaryOp;
        super(node, 'UnaryOp');

        this.expr = expression(node.expr as Node);
        this.op = node.op;
    }
}

class BinaryOp extends Node {
    readonly left: Expression;
    readonly op: string;
    readonly right: Expression;

    constructor(json: Node) {
        const node = json as BinaryOp;
        super(node, 'BinaryOp');

        this.left = expression(node.left as Node);
        this.op = node.op;
        this.right = expression(node.right as Node);
    }
}

class TernaryOp extends Node {
    readonly cond: Expression;
    readonly iffalse: Expression;
    readonly iftrue: Expression;

    constructor(json: Node) {
        const node = json as TernaryOp;
        super(node, 'TernaryOp');

        this.cond = expression(node.cond as Node);
        this.iffalse = expression(node.iffalse as Node);
        this.iftrue = expression(node.iftrue as Node);
    }
}

class Constant extends Node {
    readonly type: string;
    readonly value: string;

    constructor(json: Node) {
        const node = json as Constant;
        super(node, 'Constant');

        this.type = node.type;
        this.value = node.value;
    }
}

class ID extends Node {
    readonly name: string;

    constructor(json: Node) {
        const node = json as ID;
        super(node, 'ID');

        this.name = node.name;
    }
}

class StructRef extends Node {
    readonly field: ID;
    readonly name: ID;
    readonly type: string;

    constructor(json: Node) {
        const node = json as StructRef;
        super(node, 'StructRef');

        this.field = node.field;
        this.name = node.name;
        this.type = node.type;
    }
}

class ArrayRef extends Node {
    readonly name: ID | StructRef;
    readonly subscript: Expression;

    constructor(json: Node) {
        const node = json as ArrayRef;
        super(node, 'ArrayRef');

        switch (node.name._nodetype) {
            case 'ID':
                this.name = new ID(node.name as Node);
                break;
            case 'StructRef':
                this.name = new StructRef(node.name as Node);
                break;
            default:
                throw unsupportedType(node.name as Node);
        }

        this.subscript = expression(node.subscript as Node);
    }
}

class FuncCall extends Node {
    readonly name: ID;
    readonly args: ExprList | null;

    constructor(json: Node) {
        const node = json as FuncCall;
        super(node, 'FuncCall');

        this.name = node.name;

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ExprList(node.args as Node);
        }
    }
}

class EmptyStatement extends Node {
    constructor(json: Node) {
        const node = json as EmptyStatement;
        super(node, 'EmptyStatement');
    }
}

type Expression = (
    ID | StructRef | ArrayRef | Constant | Cast | Assignment | FuncCall |
    Typename | UnaryOp | BinaryOp | TernaryOp
);

function expression(node: Node): Expression {
    switch (node._nodetype) {
        case 'ID':
            return new ID(node as Node);
        case 'StructRef':
            return new StructRef(node as Node);
        case 'ArrayRef':
            return new ArrayRef(node as Node);
        case 'Constant':
            return new Constant(node as Node);
        case 'Cast':
            return new Cast(node as Node);
        case 'Assignment':
            return new Assignment(node as Node);
        case 'FuncCall':
            return new FuncCall(node as Node);
        case 'Typename':
           return new Typename(node as Node);
        case 'UnaryOp':
            return new UnaryOp(node as Node);
        case 'BinaryOp':
            return new BinaryOp(node as Node);
        case 'TernaryOp':
            return new TernaryOp(node as Node);
        default:
            throw unsupportedType(node);
    }
}

type CompoundItem = (
    Decl | If | Assignment | UnaryOp | Return | FuncCall | While | DoWhile |
    Label | Goto | Switch | Default | Case | Break | EmptyStatement
);

function compoundItem(node: Node): CompoundItem {
    switch (node._nodetype) {
        case 'Decl':
        return new Decl(node);
        case 'If':
            return new If(node);
        case 'Assignment':
            return new Assignment(node);
        case 'UnaryOp':
            return new UnaryOp(node);
        case 'Return':
            return new Return(node);
        case 'FuncCall':
            return new FuncCall(node);
        case 'While':
            return new While(node);
        case 'DoWhile':
            return new DoWhile(node);
        case 'For':
            return new For(node);
        case 'Label':
            return new Label(node);
        case 'Goto':
            return new Goto(node);
        case 'Switch':
            return new Switch(node);
        case 'Default':
            return new Default(node);
        case 'Case':
            return new Case(node);
        case 'Break':
            return new Break(node);
        case 'Continue':
            return new Continue(node);
        case 'EmptyStatement':
            return new EmptyStatement(node);
        default:
            throw unsupportedType(node);
    }
}

type Block = Compound | CompoundItem;

function block(node: Node): Block {
    switch (node._nodetype) {
        case 'Compound':
            return new Compound(node);
        default:
            return compoundItem(node);
    }
}

class Label extends Node {
    readonly name: string;
    readonly stmt: Block;

    constructor(json: Node) {
        const node = json as Label;
        super(node, 'Label');

        this.name = node.name;
        this.stmt = block(node.stmt as Node);
    }
}

class Goto extends Node {
    readonly name: string;

    constructor(json: Node) {
        const node = json as Goto;
        super(node, 'Goto');

        this.name = node.name;
    }
}

class Compound extends Node {
    // tslint:disable-next-line:variable-name
    readonly block_items: CompoundItem[];

    constructor(json: Node) {
        const node = json as Compound;
        super(node, 'Compound');

        this.block_items = node.block_items
            .map((node: Node) => compoundItem(node));
    }
}

class While extends Node {
    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        const node = json as While;
        super(node, 'While');

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }
}

class DoWhile extends Node {
    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        const node = json as DoWhile;
        super(node, 'DoWhile');

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }
}

class For extends Node {
    readonly init: Assignment;
    readonly next: Expression;
    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        const node = json as For;
        super(node, 'For');

        this.init = new Assignment(node.init as Node);
        this.next = expression(node.next as Node);
        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }
}

class Switch extends Node {
    readonly cond: Expression;
    readonly stmt: Compound;

    constructor(json: Node) {
        const node = json as Switch;
        super(node, 'Switch');

        this.cond = expression(node.cond as Node);
        this.stmt = new Compound(node.stmt as Node);
    }
}

class Default extends Node {
    readonly stmts: CompoundItem[] | null;

    constructor(json: Node) {
        const node = json as Default;
        super(node, 'Default');

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map((node: Node) => compoundItem(node));
        }
    }
}

class Case extends Node {
    readonly expr: Expression;
    readonly stmts: CompoundItem[] | null;

    constructor(json: Node) {
        const node = json as Case;
        super(node, 'Case');

        this.expr = expression(node.expr as Node);

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map((node: Node) => compoundItem(node));
        }
    }
}

class Break extends Node {
    constructor(json: Node) {
        const node = json as Break;
        super(node, 'Break');
    }
}

class Continue extends Node {
    constructor(json: Node) {
        const node = json as Continue;
        super(node, 'Continue');
    }
}

class If extends Node {
    readonly cond: Expression;
    readonly iffalse: Block | null;
    readonly iftrue: Block;

    constructor(json: Node) {
        const node = json as If;
        super(node, 'If');

        this.cond = expression(node.cond as Node);
        if (node.iffalse === null) {
            this.iffalse = null;
        } else {
            this.iffalse = block(node.iffalse);
        }

        this.iftrue = block(node.iftrue);
    }
}

class ExprList extends Node {
    readonly exprs: Expression[];

    constructor(json: Node) {
        const node = json as ExprList;
        super(node, 'ExprList');

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }
}

class Assignment extends Node {
    readonly lvalue: ID | UnaryOp | StructRef | ArrayRef;
    readonly op: string;
    readonly rvalue: Expression;

    constructor(json: Node) {
        const node = json as Assignment;
        super(node, 'Assignment');

        switch (node.lvalue._nodetype) {
            case 'ID':
                this.lvalue = new ID(node.lvalue as Node);
                break;
            case 'UnaryOp':
                this.lvalue = new UnaryOp(node.lvalue as Node);
                break;
            case 'StructRef':
                this.lvalue = new StructRef(node.lvalue as Node);
                break;
            case 'ArrayRef':
                this.lvalue = new ArrayRef(node.lvalue as Node);
                break;
            default:
                throw unsupportedType(node.lvalue as Node);
        }

        this.op = node.op;
        this.rvalue = expression(node.rvalue as Node);
    }
}

class Return extends Node {
    readonly expr: Expression;

    constructor(json: Node) {
        const node = json as Return;
        super(node, 'Return');

        this.expr = expression(node.expr as Node);
    }
}

class ParamList extends Node {
    readonly params: Array<Typename | Decl | ID>;

    constructor(json: Node) {
        const node = json as ParamList;
        super(node, 'ParamList');

        this.params = node.params.map(
            function convert(json: Node): Typename | Decl | ID {
                switch (json._nodetype) {
                    case 'Typename':
                        return new Typename(json);
                    case 'Decl':
                        return new Decl(json);
                    case 'ID': // Old-style K&R C   :(
                        return new ID(json);
                    default:
                        throw unsupportedType(json);
                }
            }
        );
    }
}

class Typename extends Node {
    readonly name: null;
    readonly quals: Node[];
    readonly type: TypeDecl | PtrDecl;

    constructor(json: Node) {
        const node = json as Typename;
        super(node, 'Typename');

        this.name = node.name;
        this.quals = assertEmpty(node.quals);

        switch (node.type._nodetype) {
            case 'TypeDecl':
                this.type = new TypeDecl(node.type as Node);
                break;
            case 'PtrDecl':
                this.type = new PtrDecl(node.type as Node);
                break;
            default:
                throw unsupportedType(node.type as Node);
        }
    }
}

class FileAST extends Node {
    readonly ext: Array<Decl | FuncDef>;

    constructor(json: Node) {
        const node = json as FileAST;
        super(node, 'FileAST');

        this.ext = node.ext.map(
            function convert(json: Node): Decl | FuncDef {
                switch (json._nodetype) {
                    case 'Decl':
                        return new Decl(json);
                    case 'FuncDef':
                        return new FuncDef(json);
                    default:
                        throw unsupportedType(json);
                }
            }
        );
    }
}

function assertEmpty(nodes: Node[]): Node[] {
    assert(nodes.length === 0);
    return nodes;
}

function unsupportedType(node: Node): Error {
    return new Error(`unknown nodetype ${node._nodetype}, from ${node.coord}`);
}

export function convertToTypedAST(node: Node) {
    assert(node._nodetype === 'FileAST');
    return new FileAST(node);
}
