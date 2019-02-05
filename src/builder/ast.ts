
export declare type TransformFunc = <T extends Node, TT extends Node>(
    child: T, parent: TT
) => T;

export abstract class Node {
    readonly abstract _nodetype: string;
    readonly neverSimicolon: boolean = false;
    readonly coord: string | null;

    constructor(node: Node, expectedType: string) {
        if (node._nodetype !== expectedType) {
            throw new Error(
                `unexpected type ${node._nodetype}, ` +
                `expected ${expectedType} from ${node.coord}`
            );
        }

        this.coord = node.coord;
    }

    abstract exportAsCode(): string;

    abstract transformChildren(transform: TransformFunc): Node;

    protected assertEmpty(nodes: Node[]): Node[] {
        if (nodes.length !== 0) {
            throw new Error(
                `expected empty array in ${this._nodetype} from ${this.coord}`
            );
        }
        return nodes;
    }

    protected assertString(value: string): string {
        if (typeof value !== 'string') {
            throw new Error(
                `expected string in ${this._nodetype} from ${this.coord}`
            );
        }
        return value;
    }

    protected assertNull(value: null): null {
        if (value !== null) {
            throw new Error(
                `expected null in ${this._nodetype} from ${this.coord}`
            );
        }
        return value;
    }
}

export declare type AllDecl = Decl | TypeDecl | FuncDecl | ArrayDecl | PtrDecl;

export class Decl extends Node {
    readonly _nodetype: string = 'Decl';

    readonly bitsize: null;
    readonly funcspec: Node[];
    init: InitList | Constant | UnaryOp | null;
    readonly name: string;
    readonly quals: Node[];
    readonly storage: string[];
    type: AllDecl;

    constructor(json: Node) {
        super(json, 'Decl');
        const node = json as Decl;

        this.bitsize = this.assertNull(node.bitsize);
        this.funcspec = this.assertEmpty(node.funcspec);

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

        this.name = this.assertString(node.name);
        this.quals = this.assertEmpty(node.quals);
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

    transformChildren(transform: TransformFunc): Decl {
        if (this.init !== null) {
            this.init = transform(this.init, this);
        }
        this.type = transform(this.type, this);

        return this;
    }

    exportAsCode(): string {
        const stroage = this.storage.join(' ');
        const type = this.type.exportAsCode();
        const init = this.init === null ? '' : `= ${this.init.exportAsCode()}`;

        return `${stroage} ${type} ${init}`.trim();
    }
}

export class FuncDecl extends Node {
    readonly _nodetype: string = 'FuncDecl';

    args: ParamList | null;
    type: TypeDecl;

    constructor(json: Node) {
        super(json, 'FuncDecl');
        const node = json as FuncDecl;

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ParamList(node.args as Node);
        }

        this.type = new TypeDecl(node.type as Node);
    }

    transformChildren(transform: TransformFunc): FuncDecl {
        if (this.args !== null) {
            this.args = transform(this.args, this);
        }
        this.type = transform(this.type, this);

        return this;
    }

    exportAsCode() {
        let args = '()';
        if (this.args !== null) {
            args = this.args.exportAsCode();
        }

        return `${this.type.exportAsCode()}${args}`;
    }
}

export class TypeDecl extends Node {
    readonly _nodetype: string = 'TypeDecl';

    readonly declname: string | null;
    readonly quals: Node[];
    type: IdentifierType;

    constructor(json: Node) {
        super(json, 'TypeDecl');
        const node = json as TypeDecl;

        this.declname = node.declname;
        this.quals = this.assertEmpty(node.quals);
        this.type = new IdentifierType(node.type);
    }

    transformChildren(transform: TransformFunc): TypeDecl {
        this.type = transform(this.type, this);
        return this;
    }

    getType(): string {
        return this.type.exportAsCode();
    }

    getName(): string {
        return this.declname || '';
    }

    exportAsCode(): string {
        return `${this.getType()} ${this.getName()}`.trim();
    }
}

export class ArrayDecl extends Node {
    readonly _nodetype: string = 'ArrayDecl';

    dim: Constant | null;
    // tslint:disable-next-line:variable-name
    readonly dim_quals: Node[];
    type: TypeDecl;

    constructor(json: Node) {
        super(json, 'ArrayDecl');
        const node = json as ArrayDecl;

        if (node.dim === null) {
            this.dim = null;
        } else {
            this.dim = new Constant(node.dim);
        }

        this.dim_quals = this.assertEmpty(node.dim_quals);
        this.type = new TypeDecl(node.type as Node);
    }

    transformChildren(transform: TransformFunc): ArrayDecl {
        if (this.dim !== null) {
            this.dim = transform(this.dim, this);
        }
        this.type = transform(this.type, this);
        return this;
    }

    exportAsCode(): string {
        const type = this.type.exportAsCode();
        return `${type}[${this.dim === null ? '' : this.dim.exportAsCode()}]`;
    }
}

export class PtrDecl extends Node {
    readonly _nodetype: string = 'PtrDecl';

    readonly quals: Node[];
    type: TypeDecl;

    constructor(json: Node) {
        super(json, 'PtrDecl');
        const node = json as PtrDecl;

        this.quals = this.assertEmpty(node.quals);
        this.type = new TypeDecl(node.type as Node);
    }

    transformChildren(transform: TransformFunc): PtrDecl {
        this.type = transform(this.type, this);
        return this;
    }

    exportAsCode() {
        const name = this.type.getName();
        return `${this.type.getType()}*${name === '' ? '' : ' ' + name}`;
    }
}

export class InitList extends Node {
    readonly _nodetype: string = 'InitList';

    exprs: Expression[];

    constructor(json: Node) {
        super(json, 'InitList');
        const node = json as InitList;

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }

    transformChildren(transform: TransformFunc): InitList {
        this.exprs = this.exprs.map((expr) => transform(expr, this));
        return this;
    }

    exportAsCode(): string {
        const values = this.exprs.map((expr) => expr.exportAsCode()).join(', ');
        return '{' + values + '}';
    }
}

export class IdentifierType extends Node {
    readonly _nodetype: string = 'IdentifierType';

    readonly names: string[];

    constructor(json: Node) {
        super(json, 'IdentifierType');
        const node = json as IdentifierType;

        this.names = node.names;
    }

    transformChildren(transform: TransformFunc): IdentifierType {
        return this;
    }

    exportAsCode(): string {
        return this.names.join(' ');
    }
}

export class ParamList extends Node {
    readonly _nodetype: string = 'ParamList';

    params: Array<Typename | Decl | ID>;

    constructor(json: Node) {
        super(json, 'ParamList');
        const node = json as ParamList;

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

    transformChildren(transform: TransformFunc): ParamList {
        this.params = this.params.map((param) => transform(param, this));
        return this;
    }

    exportAsCode(): string {
        const params = this.params
            .map((param) => param.exportAsCode()).join(', ');
        return `(${params})`;
    }
}

export class Typename extends Node {
    readonly _nodetype: string = 'Typename';

    readonly name: null;
    readonly quals: Node[];
    type: TypeDecl | PtrDecl;

    constructor(json: Node) {
        super(json, 'Typename');
        const node = json as Typename;

        this.name = this.assertNull(node.name);
        this.quals = this.assertEmpty(node.quals);

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

    transformChildren(transform: TransformFunc): Typename {
        this.type = transform(this.type, this);
        return this;
    }

    exportAsCode(): string {
        return this.type.exportAsCode();
    }
}

export class FuncDef extends Node {
    readonly _nodetype: string = 'FuncDef';
    readonly neverSimicolon: boolean = true;

    body: Compound;
    decl: Decl;
    // tslint:disable-next-line:variable-name
    param_decls: Decl[] | null; // Old-style K&R C   :(

    constructor(json: Node) {
        super(json, 'FuncDef');
        const node = json as FuncDef;

        this.body = new Compound(node.body as Node);
        this.decl = new Decl(node.decl as Decl);

        if (node.param_decls === null) {
            this.param_decls = null;
        } else {
            this.param_decls = node.param_decls
                .map((node: Node) => new Decl(node));
        }
    }

    transformChildren(transform: TransformFunc): FuncDef {
        this.body = transform(this.body, this);
        this.decl = transform(this.decl, this);
        if (this.param_decls !== null) {
            this.param_decls = this.param_decls
                .map((decl) => transform(decl, this));
        }
        return this;
    }

    exportAsCode(): string {
        const body = this.body.exportAsCode();
        const decl = this.decl.exportAsCode();
        let decls = '';
        if (this.param_decls !== null) {
            decls = ' ' + this.param_decls
                .map((decl) => decl.exportAsCode())
                .join(', ');
        }

        return `${decl}${decls} ${body}`;
    }
}

export class Cast extends Node {
    readonly _nodetype: string = 'Cast';

    expr: Expression;
    // tslint:disable-next-line:variable-name
    to_type: Typename;

    constructor(json: Node) {
        super(json, 'Cast');
        const node = json as Cast;

        this.expr = expression(node.expr as Node);
        this.to_type = new Typename(node.to_type as Node);
    }

    transformChildren(transform: TransformFunc): Cast {
        this.expr = transform(this.expr, this);
        this.to_type = transform(this.to_type, this);
        return this;
    }

    exportAsCode(): string {
        return `(${this.to_type.exportAsCode()})${this.expr.exportAsCode()}`;
    }
}

export class UnaryOp extends Node {
    readonly _nodetype: string = 'UnaryOp';

    expr: Expression;
    readonly op: string;

    constructor(json: Node) {
        super(json, 'UnaryOp');
        const node = json as UnaryOp;

        this.expr = expression(node.expr as Node);
        this.op = this.assertString(node.op);
    }

    transformChildren(transform: TransformFunc): UnaryOp {
        this.expr = transform(this.expr, this);
        return this;
    }

    exportAsCode(): string {
        switch (this.op) {
            case 'p++':
                return `${this.expr.exportAsCode()}++`;
            case '++p':
                return `++${this.expr.exportAsCode()}`;
            default:
                return `${this.op}${this.expr.exportAsCode()}`;
        }
    }
}

export class BinaryOp extends Node {
    readonly _nodetype: string = 'BinaryOp';

    left: Expression;
    readonly op: string;
    right: Expression;

    constructor(json: Node) {
        super(json, 'BinaryOp');
        const node = json as BinaryOp;

        this.left = expression(node.left as Node);
        this.op = this.assertString(node.op);
        this.right = expression(node.right as Node);
    }

    transformChildren(transform: TransformFunc): BinaryOp {
        this.left = transform(this.left, this);
        this.right = transform(this.right, this);
        return this;
    }

    exportAsCode(): string {
        const left = this.left.exportAsCode();
        const right = this.right.exportAsCode();
        return `(${left} ${this.op} ${right})`;
    }
}

export class TernaryOp extends Node {
    readonly _nodetype: string = 'TernaryOp';

    cond: Expression;
    iffalse: Expression;
    iftrue: Expression;

    constructor(json: Node) {
        super(json, 'TernaryOp');
        const node = json as TernaryOp;

        this.cond = expression(node.cond as Node);
        this.iffalse = expression(node.iffalse as Node);
        this.iftrue = expression(node.iftrue as Node);
    }

    transformChildren(transform: TransformFunc): TernaryOp {
        this.cond = transform(this.cond, this);
        this.iffalse = transform(this.iffalse, this);
        this.iftrue = transform(this.iftrue, this);
        return this;
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const iffalse = this.iffalse.exportAsCode();
        const iftrue = this.iftrue.exportAsCode();

        return `(${cond} ? ${iftrue} : ${iffalse})`;
    }
}

export class Constant extends Node {
    readonly _nodetype: string = 'Constant';

    readonly type: string;
    readonly value: string;

    constructor(json: Node) {
        super(json, 'Constant');
        const node = json as Constant;

        this.type = this.assertString(node.type);
        this.value = this.assertString(node.value);
    }

    transformChildren(transform: TransformFunc): Constant {
        return this;
    }

    exportAsCode(): string {
        return this.value;
    }
}

export class ID extends Node {
    readonly _nodetype: string = 'ID';

    name: string;

    constructor(json: Node) {
        super(json, 'ID');
        const node = json as ID;

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc): ID {
        return this;
    }

    exportAsCode(): string {
        return this.name;
    }
}

export class StructRef extends Node {
    readonly _nodetype: string = 'StructRef';

    field: ID;
    name: ID;
    readonly type: string;

    constructor(json: Node) {
        super(json, 'StructRef');
        const node = json as StructRef;

        this.field = node.field;
        this.name = node.name;
        this.type = node.type;
    }

    transformChildren(transform: TransformFunc): StructRef {
        this.field = transform(this.field, this);
        this.name = transform(this.name, this);
        return this;
    }

    exportAsCode(): string {
        return `${this.name.exportAsCode()}.${this.field.exportAsCode()}`;
    }
}

export class ArrayRef extends Node {
    readonly _nodetype: string = 'ArrayRef';

    name: ID | StructRef;
    subscript: Expression;

    constructor(json: Node) {
        super(json, 'ArrayRef');
        const node = json as ArrayRef;

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

    transformChildren(transform: TransformFunc): ArrayRef {
        this.name = transform(this.name, this);
        this.subscript = transform(this.subscript, this);
        return this;
    }

    exportAsCode(): string {
        return `${this.name.exportAsCode()}[${this.subscript.exportAsCode()}]`;
    }
}

export class FuncCall extends Node {
    readonly _nodetype: string = 'FuncCall';

    name: ID;
    args: ExprList | null;

    constructor(json: Node) {
        super(json, 'FuncCall');
        const node = json as FuncCall;

        this.name = new ID(node.name as Node);

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ExprList(node.args as Node);
        }
    }

    transformChildren(transform: TransformFunc): FuncCall {
        this.name = transform(this.name, this);
        if (this.args !== null) {
            this.args = transform(this.args, this);
        }
        return this;
    }

    exportAsCode(): string {
        let args = '';
        if (this.args !== null) {
            args = this.args.exportAsCode();
        }
        return `${this.name.exportAsCode()}${args}`;
    }
}

export class EmptyStatement extends Node {
    readonly _nodetype: string = 'EmptyStatement';

    constructor(json: Node) {
        super(json, 'EmptyStatement');
    }

    transformChildren(transform: TransformFunc): EmptyStatement {
        return this;
    }

    exportAsCode(): string {
        return '';
    }
}

export declare type Expression = (
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

export declare type CompoundItem = (
    Decl | If | Assignment | UnaryOp | Return | FuncCall |
    While | DoWhile | For | Label | Goto | Switch | Default | Continue |
    Case | Break | EmptyStatement
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

export declare type Block = Compound | CompoundItem;

function block(node: Node): Block {
    switch (node._nodetype) {
        case 'Compound':
            return new Compound(node);
        default:
            return compoundItem(node);
    }
}

export class Label extends Node {
    readonly _nodetype: string = 'Label';

    readonly name: string;
    stmt: Block;

    constructor(json: Node) {
        super(json, 'Label');
        const node = json as Label;

        this.name = this.assertString(node.name);
        this.stmt = block(node.stmt as Node);
    }

    transformChildren(transform: TransformFunc): Label {
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        return `${this.name}: ${this.stmt.exportAsCode()}`;
    }
}

export class Goto extends Node {
    readonly _nodetype: string = 'Goto';

    readonly name: string;

    constructor(json: Node) {
        super(json, 'Goto');
        const node = json as Goto;

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc): Goto {
        return this;
    }

    exportAsCode(): string {
        return `goto ${this.name}`;
    }
}

export class Compound extends Node {
    readonly _nodetype: string = 'Compound';
    readonly neverSimicolon: boolean = true;

    // tslint:disable-next-line:variable-name
    block_items: CompoundItem[];

    constructor(json: Node) {
        super(json, 'Compound');
        const node = json as Compound;

        this.block_items = node.block_items
            .map((node: Node) => compoundItem(node));
    }

    transformChildren(transform: TransformFunc): Compound {
        this.block_items = this.block_items
            .map((block) => transform(block, this));
        return this;
    }

    exportAsCode(): string {
        const items = this.block_items.map((item) => (
            indentCode(item.exportAsCode()) +
            (item.neverSimicolon ? '' : ';')
        ));

        return '{\n' +
                items.join('\n') + '\n' +
                '}';
    }
}

export class While extends Node {
    readonly _nodetype: string = 'While';
    readonly neverSimicolon: boolean = true;

    cond: Expression;
    stmt: Block;

    constructor(json: Node) {
        super(json, 'While');
        const node = json as While;

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    transformChildren(transform: TransformFunc): While {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `while(${cond}) ${stmt}\n`;
    }
}

export class DoWhile extends Node {
    readonly _nodetype: string = 'DoWhile';

    cond: Expression;
    stmt: Block;

    constructor(json: Node) {
        super(json, 'DoWhile');
        const node = json as DoWhile;

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    transformChildren(transform: TransformFunc): DoWhile {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `do ${stmt} while(${cond})`;
    }
}

export class For extends Node {
    readonly neverSimicolon: boolean = true;
    readonly _nodetype: string = 'For';

    init: Assignment | Decl;
    next: Expression;
    cond: Expression;
    stmt: Block;

    constructor(json: Node) {
        super(json, 'For');
        const node = json as For;

        switch (node.init._nodetype) {
            case 'Assignment':
                this.init = new Assignment(node.init as Node);
                break;
            case 'Decl':
                this.init = new Decl(node.init as Node);
                break;
            default:
                throw unsupportedType(node.init as Node);
        }

        this.next = expression(node.next as Node);
        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    transformChildren(transform: TransformFunc): For {
        this.init = transform(this.init, this);
        this.next = transform(this.next, this);
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        const init = this.init.exportAsCode();
        const next = this.next.exportAsCode();
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `for (${init}; ${cond}; ${next}) ${stmt}\n`;
    }
}

export class Switch extends Node {
    readonly neverSimicolon: true;
    readonly _nodetype: string = 'Switch';

    cond: Expression;
    stmt: Compound;

    constructor(json: Node) {
        super(json, 'Switch');
        const node = json as Switch;

        this.cond = expression(node.cond as Node);
        this.stmt = new Compound(node.stmt as Node);
    }

    transformChildren(transform: TransformFunc): Switch {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `swtich(${cond}) ${stmt}\n`;
    }
}

export class Default extends Node {
    readonly _nodetype: string = 'Default';

    stmts: CompoundItem[] | null;

    constructor(json: Node) {
        super(json, 'Default');
        const node = json as Default;

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map((node: Node) => compoundItem(node));
        }
    }

    transformChildren(transform: TransformFunc): Default {
        if (this.stmts !== null) {
            this.stmts = this.stmts
                .map((stmt) => transform(stmt, this));
        }
        return this;
    }

    exportAsCode(): string {
        let stmts = '';
        if (this.stmts !== null) {
            stmts = this.stmts
                .map((stmt) => (
                    indentCode(stmt.exportAsCode()) +
                    stmt.neverSimicolon ? '' : ';'
                ))
                .join('\n');
        }
        return `default:\n` +
               `${stmts}`;
    }
}

export class Case extends Node {
    readonly _nodetype: string = 'Case';

    expr: Expression;
    stmts: CompoundItem[] | null;

    constructor(json: Node) {
        super(json, 'Case');
        const node = json as Case;

        this.expr = expression(node.expr as Node);

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map((node: Node) => compoundItem(node));
        }
    }

    transformChildren(transform: TransformFunc): Case {
        this.expr = transform(this.expr, this);
        if (this.stmts !== null) {
            this.stmts = this.stmts
                .map((stmt) => transform(stmt, this));
        }
        return this;
    }

    exportAsCode(): string {
        let stmts = '';
        if (this.stmts !== null) {
            stmts = this.stmts
            .map((stmt) => (
                indentCode(stmt.exportAsCode()) +
                stmt.neverSimicolon ? '' : ';'
            ))
            .join('\n');
        }
        return `case ${this.expr.exportAsCode()}:\n` +
               `${stmts}`;
    }
}

export class Break extends Node {
    readonly _nodetype: string = 'Break';

    constructor(json: Node) {
        super(json, 'Break');
    }

    transformChildren(transform: TransformFunc): Break {
        return this;
    }

    exportAsCode(): string {
        return `break`;
    }
}

export class Continue extends Node {
    readonly _nodetype: string = 'Continue';

    constructor(json: Node) {
        super(json, 'Continue');
    }

    transformChildren(transform: TransformFunc): Continue {
        return this;
    }

    exportAsCode(): string {
        return `continue`;
    }
}

export class If extends Node {
    readonly _nodetype: string = 'If';
    readonly neverSimicolon: boolean = true;

    cond: Expression;
    iffalse: Block | null;
    iftrue: Block;

    constructor(json: Node) {
        super(json, 'If');
        const node = json as If;

        this.cond = expression(node.cond as Node);
        if (node.iffalse === null) {
            this.iffalse = null;
        } else {
            this.iffalse = block(node.iffalse);
        }

        this.iftrue = block(node.iftrue);
    }

    transformChildren(transform: TransformFunc): If {
        this.cond = transform(this.cond, this);
        if (this.iffalse !== null) {
            this.iffalse = transform(this.iffalse, this);
        }
        this.iftrue = transform(this.iftrue, this);
        return this;
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();

        const iftrue = (
            this.iftrue.exportAsCode() +
            (this.iftrue.neverSimicolon ? '' : ';')
        );

        let elseblock = '';
        if (this.iffalse !== null) {
            elseblock = (
                ' else ' + this.iffalse.exportAsCode() +
                (this.iffalse.neverSimicolon ? '' : ';')
            );
        }

        return `if (${cond}) ${iftrue}${elseblock}`;
    }
}

export class ExprList extends Node {
    readonly _nodetype: string = 'ExprList';

    exprs: Expression[];

    constructor(json: Node) {
        super(json, 'ExprList');
        const node = json as ExprList;

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }

    transformChildren(transform: TransformFunc): ExprList {
        this.exprs = this.exprs
            .map((expr) => transform(expr, this));
        return this;
    }

    exportAsCode(): string {
        const exprs = this.exprs.map((expr) => expr.exportAsCode());
        return `(${exprs.join(', ')})`;
    }
}

export class Assignment extends Node {
    readonly _nodetype: string = 'Assignment';

    lvalue: ID | UnaryOp | StructRef | ArrayRef;
    readonly op: string;
    rvalue: Expression;

    constructor(json: Node) {
        super(json, 'Assignment');
        const node = json as Assignment;

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

        this.op = this.assertString(node.op);
        this.rvalue = expression(node.rvalue as Node);
    }

    transformChildren(transform: TransformFunc): Assignment {
        this.lvalue = transform(this.lvalue, this);
        this.rvalue = transform(this.rvalue, this);
        return this;
    }

    exportAsCode(): string {
        const lvalue = this.lvalue.exportAsCode();
        const rvalue = this.rvalue.exportAsCode();
        return `${lvalue} ${this.op} ${rvalue}`;
    }
}

export class Return extends Node {
    readonly _nodetype: string = 'Return';

    expr: Expression;

    constructor(json: Node) {
        super(json, 'Return');
        const node = json as Return;

        this.expr = expression(node.expr as Node);
    }

    transformChildren(transform: TransformFunc): Return {
        this.expr = transform(this.expr, this);
        return this;
    }

    exportAsCode(): string {
        return `return ${this.expr.exportAsCode()}`;
    }
}

export class FileAST extends Node {
    readonly _nodetype: string = 'FileAST';
    readonly neverSimicolon: true;

    ext: Array<Decl | FuncDef>;

    constructor(json: Node) {
        super(json, 'FileAST');
        const node = json as FileAST;

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

    transformChildren(transform: TransformFunc): FileAST {
        this.ext = this.ext
            .map((node) => transform(node, this));
        return this;
    }

    exportAsCode(): string {
        const ext = this.ext.map((node) => (
            node.exportAsCode() + (node.neverSimicolon ? '' : ';')
        ));

        return ext.join('\n');
    }
}

function unsupportedType(node: Node): Error {
    return new Error(`unknown _nodetype ${node._nodetype}, from ${node.coord}`);
}

function indentCode(code: string): string {
    return code
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n');
}
