
export type TransformFunc = (<T extends Node, TT extends Node>(child: T, parent: TT) => T);

interface NodeInterface {
    readonly _nodetype: string;
    readonly coord: string | null;
}

export abstract class Node implements NodeInterface {
    readonly _nodetype: string;
    readonly neverSimicolon: boolean = false;
    readonly coord: string | null;

    constructor(node: NodeInterface, expectedNodetype: string) {
        if (node._nodetype !== expectedNodetype) {
            throw new Error(
                `unexpected type ${node._nodetype}, ` +
                `expected ${expectedNodetype} from ${node.coord}`
            );
        }

        this._nodetype = expectedNodetype;
        this.coord = node.coord;
    }

    abstract exportAsCode(): string;

    abstract transformChildren(transform: TransformFunc): Node;

    protected assertEmpty(nodes: NodeInterface[]): Node[] {
        if (nodes.length !== 0) {
            throw new Error(
                `expected empty array in ${this._nodetype} from ${this.coord}`
            );
        }
        return [];
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

declare type AllDeclInterface = (
    DeclInterface | TypeDeclInterface | FuncDeclInterface |
    ArrayDeclInterface | PtrDeclInterface
);
export declare type AllDecl = Decl | TypeDecl | FuncDecl | ArrayDecl | PtrDecl;

interface DeclInterface extends NodeInterface {
    readonly bitsize: null;
    readonly funcspec: Node[];
    init: InitListInterface | ConstantInterface | UnaryOpInterface | null;
    readonly name: string;
    readonly quals: Node[];
    readonly storage: string[];
    type: AllDeclInterface;
}

export class Decl extends Node implements DeclInterface {
    readonly _nodetype: 'Decl';

    readonly bitsize: null;
    readonly funcspec: Node[];
    init: InitList | Constant | UnaryOp | null;
    readonly name: string;
    readonly quals: Node[];
    readonly storage: string[];
    type: AllDecl;

    constructor(node: DeclInterface) {
        super(node, 'Decl');

        this.bitsize = this.assertNull(node.bitsize);
        this.funcspec = this.assertEmpty(node.funcspec);

        if (node.init === null) {
            this.init = null;
        } else {
            this.init = instantiate<
                InitList | Constant | UnaryOp,
                InitListInterface | ConstantInterface | UnaryOpInterface
            >(node.init, ['InitList', 'Constant', 'UnaryOp']);
        }

        this.name = this.assertString(node.name);
        this.quals = this.assertEmpty(node.quals);
        this.storage = node.storage;

        this.type = instantiate<
            AllDecl,
            AllDeclInterface
        >(node.type, ['Decl', 'TypeDecl', 'FuncDecl', 'ArrayDecl', 'PtrDecl']);
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

interface FuncDeclInterface extends NodeInterface {
    args: ParamListInterface | null;
    type: TypeDeclInterface;
}

export class FuncDecl extends Node implements FuncDeclInterface {
    readonly _nodetype: 'FuncDecl';

    args: ParamList | null;
    type: TypeDecl;

    constructor(node: FuncDeclInterface) {
        super(node, 'FuncDecl');

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ParamList(node.args);
        }

        this.type = new TypeDecl(node.type);
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

interface TypeDeclInterface extends NodeInterface {
    readonly declname: string | null;
    readonly quals: NodeInterface[];
    type: IdentifierTypeInterface;
}

export class TypeDecl extends Node implements TypeDeclInterface {
    readonly _nodetype: 'TypeDecl';

    readonly declname: string | null;
    readonly quals: Node[];
    type: IdentifierType;

    constructor(node: TypeDeclInterface) {
        super(node, 'TypeDecl');

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

interface ArrayDeclInterface extends NodeInterface {
    dim: Constant | null;
    // tslint:disable-next-line:variable-name
    readonly dim_quals: Node[];
    type: TypeDecl;
}

export class ArrayDecl extends Node implements ArrayDeclInterface {
    readonly _nodetype: 'ArrayDecl';

    dim: Constant | null;
    // tslint:disable-next-line:variable-name
    readonly dim_quals: Node[];
    type: TypeDecl;

    constructor(node: ArrayDeclInterface) {
        super(node, 'ArrayDecl');

        if (node.dim === null) {
            this.dim = null;
        } else {
            this.dim = new Constant(node.dim);
        }

        this.dim_quals = this.assertEmpty(node.dim_quals);
        this.type = new TypeDecl(node.type);
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

interface PtrDeclInterface extends NodeInterface {
    readonly quals: Node[];
    type: TypeDeclInterface;
}

export class PtrDecl extends Node implements PtrDeclInterface {
    readonly _nodetype: 'PtrDecl';

    readonly quals: Node[];
    type: TypeDecl;

    constructor(node: PtrDeclInterface) {
        super(node, 'PtrDecl');

        this.quals = this.assertEmpty(node.quals);
        this.type = new TypeDecl(node.type);
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

interface InitListInterface extends NodeInterface {
    exprs: ExpressionInterface[];
}

export class InitList extends Node implements InitListInterface {
    readonly _nodetype: 'InitList';

    exprs: Expression[];

    constructor(node: InitListInterface) {
        super(node, 'InitList');

        this.exprs = node.exprs.map(expression);
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

interface IdentifierTypeInterface extends NodeInterface {
    readonly names: string[];
}

export class IdentifierType extends Node implements IdentifierTypeInterface {
    readonly _nodetype: 'IdentifierType';

    readonly names: string[];

    constructor(node: IdentifierTypeInterface) {
        super(node, 'IdentifierType');

        this.names = node.names;
    }

    transformChildren(transform: TransformFunc): IdentifierType {
        return this;
    }

    exportAsCode(): string {
        return this.names.join(' ');
    }
}

interface ParamListInterface extends NodeInterface {
    params: Array<TypenameInterface | DeclInterface | AstIDInterface>;
}

export class ParamList extends Node implements ParamListInterface {
    readonly _nodetype: 'ParamList';

    params: Array<Typename | Decl | ID>;

    constructor(node: ParamListInterface) {
        super(node, 'ParamList');

        this.params = node.params.map(
            (param) => instantiate<
                Typename | Decl | ID,
                TypenameInterface | DeclInterface | AstIDInterface
            >(param, ['Typename', 'Decl', 'ID'])
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

interface TypenameInterface extends NodeInterface {
    readonly name: null;
    readonly quals: Node[];
    type: TypeDeclInterface | PtrDeclInterface;
}

export class Typename extends Node implements TypenameInterface {
    readonly _nodetype: 'Typename';

    readonly name: null;
    readonly quals: Node[];
    type: TypeDecl | PtrDecl;

    constructor(node: TypenameInterface) {
        super(node, 'Typename');

        this.name = this.assertNull(node.name);
        this.quals = this.assertEmpty(node.quals);
        this.type = instantiate<
            TypeDecl | PtrDecl,
            TypeDeclInterface | PtrDeclInterface
        >(node.type, ['TypeDecl', 'PtrDecl']);
    }

    transformChildren(transform: TransformFunc): Typename {
        this.type = transform(this.type, this);
        return this;
    }

    exportAsCode(): string {
        return this.type.exportAsCode();
    }
}

interface FuncDefInterface extends NodeInterface {
    body: CompoundInterface;
    decl: DeclInterface;
    // tslint:disable-next-line:variable-name
    param_decls: DeclInterface[] | null; // Old-style K&R C   :(
}

export class FuncDef extends Node implements FuncDefInterface {
    readonly _nodetype: 'FuncDef';
    readonly neverSimicolon: boolean = true;

    body: Compound;
    decl: Decl;
    // tslint:disable-next-line:variable-name
    param_decls: Decl[] | null; // Old-style K&R C   :(

    constructor(node: FuncDefInterface) {
        super(node, 'FuncDef');

        this.body = new Compound(node.body);
        this.decl = new Decl(node.decl as Decl);

        if (node.param_decls === null) {
            this.param_decls = null;
        } else {
            this.param_decls = node.param_decls
                .map((decl) => new Decl(decl));
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

interface CastInterface extends NodeInterface {
    expr: Expression;
    // tslint:disable-next-line:variable-name
    to_type: Typename;
}

export class Cast extends Node implements CastInterface {
    readonly _nodetype: 'Cast';

    expr: Expression;
    // tslint:disable-next-line:variable-name
    to_type: Typename;

    constructor(node: CastInterface) {
        super(node, 'Cast');

        this.expr = expression(node.expr);
        this.to_type = new Typename(node.to_type);
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

interface UnaryOpInterface extends NodeInterface {
    expr: Expression;
    readonly op: string;
}

export class UnaryOp extends Node implements UnaryOpInterface {
    readonly _nodetype: 'UnaryOp';

    expr: Expression;
    readonly op: string;

    constructor(node: UnaryOpInterface) {
        super(node, 'UnaryOp');

        this.expr = expression(node.expr);
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

interface BinaryOpInterface extends NodeInterface {
    left: ExpressionInterface;
    readonly op: string;
    right: ExpressionInterface;
}

export class BinaryOp extends Node implements BinaryOpInterface {
    readonly _nodetype: 'BinaryOp';

    left: Expression;
    readonly op: string;
    right: Expression;

    constructor(node: BinaryOpInterface) {
        super(node, 'BinaryOp');

        this.left = expression(node.left);
        this.op = this.assertString(node.op);
        this.right = expression(node.right);
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

interface TernaryOpInterface extends NodeInterface {
    cond: ExpressionInterface;
    iffalse: ExpressionInterface;
    iftrue: ExpressionInterface;
}

export class TernaryOp extends Node implements TernaryOpInterface {
    readonly _nodetype: 'TernaryOp';

    cond: Expression;
    iffalse: Expression;
    iftrue: Expression;

    constructor(node: TernaryOpInterface) {
        super(node, 'TernaryOp');

        this.cond = expression(node.cond);
        this.iffalse = expression(node.iffalse);
        this.iftrue = expression(node.iftrue);
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

interface ConstantInterface extends NodeInterface {
    readonly type: string;
    readonly value: string;
}

export class Constant extends Node implements ConstantInterface {
    readonly _nodetype: 'Constant';

    readonly type: string;
    readonly value: string;

    constructor(node: ConstantInterface) {
        super(node, 'Constant');

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

interface AstIDInterface extends NodeInterface {
    name: string;
}

export class ID extends Node implements AstIDInterface {
    readonly _nodetype: 'ID';

    name: string;

    constructor(node: AstIDInterface) {
        super(node, 'ID');

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc): ID {
        return this;
    }

    exportAsCode(): string {
        return this.name;
    }
}

interface StructRefInterface extends NodeInterface {
    field: AstIDInterface;
    name: AstIDInterface;
    readonly type: string;
}

export class StructRef extends Node implements StructRefInterface {
    readonly _nodetype: 'StructRef';

    field: ID;
    name: ID;
    readonly type: string;

    constructor(node: StructRefInterface) {
        super(node, 'StructRef');

        this.field = new ID(node.field);
        this.name = new ID(node.name);
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

interface ArrayRefInterface extends NodeInterface {
    name: AstIDInterface | StructRefInterface;
    subscript: ExpressionInterface;
}

export class ArrayRef extends Node implements ArrayRefInterface {
    readonly _nodetype: 'ArrayRef';

    name: ID | StructRef;
    subscript: Expression;

    constructor(node: ArrayRefInterface) {
        super(node, 'ArrayRef');

        this.name = instantiate<
            ID | StructRef,
            AstIDInterface | StructRefInterface
        >(node.name, ['ID', 'StructRef']);
        this.subscript = expression(node.subscript);
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

interface FuncCallInterface extends NodeInterface {
    name: AstIDInterface;
    args: ExprListInterface | null;
}

export class FuncCall extends Node implements FuncCallInterface {
    readonly _nodetype: 'FuncCall';

    name: ID;
    args: ExprList | null;

    constructor(node: FuncCallInterface) {
        super(node, 'FuncCall');

        this.name = new ID(node.name);

        if (node.args === null) {
            this.args = null;
        } else {
            this.args = new ExprList(node.args);
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

interface EmptyStatementInterface extends NodeInterface {}

export class EmptyStatement extends Node implements EmptyStatementInterface {
    readonly _nodetype: 'EmptyStatement';

    constructor(node: EmptyStatementInterface) {
        super(node, 'EmptyStatement');
    }

    transformChildren(transform: TransformFunc): EmptyStatement {
        return this;
    }

    exportAsCode(): string {
        return '';
    }
}

declare type ExpressionInterface = (
    AstIDInterface | StructRefInterface | ArrayRefInterface |
    ConstantInterface | CastInterface | AssignmentInterface |
    FuncCallInterface | TypenameInterface | UnaryOpInterface |
    BinaryOpInterface | TernaryOpInterface
);

export declare type Expression = (
    ID | StructRef | ArrayRef | Constant | Cast | Assignment | FuncCall |
    Typename | UnaryOp | BinaryOp | TernaryOp
);

function expression(node: ExpressionInterface): Expression {
    return instantiate<Expression, ExpressionInterface>(node, [
        'ID', 'StructRef', 'ArrayRef', 'Constant', 'Cast',
        'Assignment', 'FuncCall', 'Typename', 'UnaryOp', 'BinaryOp',
        'TernaryOp'
    ]);
}

declare type CompoundItemInterface = (
    DeclInterface | IfInterface | AssignmentInterface | UnaryOpInterface |
    ReturnInterface | FuncCallInterface | WhileInterface |
    DoWhileInterface | ForInterface | LabelInterface | GotoInterface |
    SwitchInterface | DefaultInterface | ContinueInterface |
    CaseInterface | BreakInterface | EmptyStatementInterface
);

export declare type CompoundItem = (
    Decl | If | Assignment | UnaryOp | Return | FuncCall |
    While | DoWhile | For | Label | Goto | Switch | Default | Continue |
    Case | Break | EmptyStatement
);

function compoundItem(node: CompoundItemInterface): CompoundItem {
    return instantiate<CompoundItem, CompoundItemInterface>(node, [
        'Decl', 'If', 'Assignment', 'UnaryOp', 'Return', 'FuncCall',
        'While', 'DoWhile', 'For', 'Label', 'Goto', 'Switch', 'Default',
        'Continue', 'Case', 'Break', 'EmptyStatement'
    ]);
}

declare type BlockInterface = CompoundInterface | CompoundItemInterface;

export declare type Block = Compound | CompoundItem;

function block(node: BlockInterface): Block {
    if (checkType<CompoundInterface>(node, 'Compound')) {
        return new Compound(node);
    } else {
        return compoundItem(node);
    }
}

interface LabelInterface extends NodeInterface {
    readonly name: string;
    stmt: BlockInterface;
}

export class Label extends Node implements LabelInterface {
    readonly _nodetype: 'Label';

    readonly name: string;
    stmt: Block;

    constructor(node: LabelInterface) {
        super(node, 'Label');

        this.name = this.assertString(node.name);
        this.stmt = block(node.stmt);
    }

    transformChildren(transform: TransformFunc): Label {
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAsCode(): string {
        return `${this.name}: ${this.stmt.exportAsCode()}`;
    }
}

interface GotoInterface extends NodeInterface {
    readonly name: string;
}

export class Goto extends Node implements GotoInterface {
    readonly _nodetype: 'Goto';

    readonly name: string;

    constructor(node: GotoInterface) {
        super(node, 'Goto');

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc): Goto {
        return this;
    }

    exportAsCode(): string {
        return `goto ${this.name}`;
    }
}

interface CompoundInterface extends NodeInterface {
    // tslint:disable-next-line:variable-name
    block_items: CompoundItem[];
}

export class Compound extends Node implements CompoundInterface {
    readonly _nodetype: 'Compound';
    readonly neverSimicolon: boolean = true;

    // tslint:disable-next-line:variable-name
    block_items: CompoundItem[];

    constructor(node: CompoundInterface) {
        super(node, 'Compound');

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

interface WhileInterface extends NodeInterface {
    cond: ExpressionInterface;
    stmt: BlockInterface;
}

export class While extends Node implements WhileInterface {
    readonly _nodetype: 'While';
    readonly neverSimicolon: boolean = true;

    cond: Expression;
    stmt: Block;

    constructor(node: WhileInterface) {
        super(node, 'While');

        this.cond = expression(node.cond);
        this.stmt = block(node.stmt);
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

interface DoWhileInterface extends NodeInterface {
    cond: ExpressionInterface;
    stmt: BlockInterface;
}

export class DoWhile extends Node implements DoWhileInterface {
    readonly _nodetype: 'DoWhile';

    cond: Expression;
    stmt: Block;

    constructor(node: DoWhileInterface) {
        super(node, 'DoWhile');

        this.cond = expression(node.cond);
        this.stmt = block(node.stmt);
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

interface ForInterface extends NodeInterface {
    init: AssignmentInterface | DeclInterface;
    next: ExpressionInterface;
    cond: ExpressionInterface;
    stmt: BlockInterface;
}

export class For extends Node implements ForInterface {
    readonly neverSimicolon: boolean = true;
    readonly _nodetype: 'For';

    init: Assignment | Decl;
    next: Expression;
    cond: Expression;
    stmt: Block;

    constructor(node: ForInterface) {
        super(node, 'For');

        this.init = instantiate<
            Assignment | Decl,
            AssignmentInterface | DeclInterface
        >(node.init, ['Assignment', 'Decl']);
        this.next = expression(node.next);
        this.cond = expression(node.cond);
        this.stmt = block(node.stmt);
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

interface SwitchInterface extends NodeInterface {
    cond: ExpressionInterface;
    stmt: CompoundInterface;
}

export class Switch extends Node implements SwitchInterface {
    readonly neverSimicolon: true;
    readonly _nodetype: 'Switch';

    cond: Expression;
    stmt: Compound;

    constructor(node: SwitchInterface) {
        super(node, 'Switch');

        this.cond = expression(node.cond);
        this.stmt = new Compound(node.stmt);
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

interface DefaultInterface extends NodeInterface {
    stmts: CompoundItemInterface[] | null;
}

export class Default extends Node implements DefaultInterface {
    readonly _nodetype: 'Default';

    stmts: CompoundItem[] | null;

    constructor(node: DefaultInterface) {
        super(node, 'Default');

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map(compoundItem);
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

interface CaseInterface extends NodeInterface {
    expr: ExpressionInterface;
    stmts: CompoundItemInterface[] | null;
}

export class Case extends Node implements CaseInterface {
    readonly _nodetype: 'Case';

    expr: Expression;
    stmts: CompoundItem[] | null;

    constructor(node: CaseInterface) {
        super(node, 'Case');

        this.expr = expression(node.expr);

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map(compoundItem);
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

interface BreakInterface extends NodeInterface {}

export class Break extends Node implements BreakInterface {
    readonly _nodetype: 'Break';

    constructor(node: BreakInterface) {
        super(node, 'Break');
    }

    transformChildren(transform: TransformFunc): Break {
        return this;
    }

    exportAsCode(): string {
        return `break`;
    }
}

interface ContinueInterface extends NodeInterface {}

export class Continue extends Node implements ContinueInterface {
    readonly _nodetype: 'Continue';

    constructor(node: ContinueInterface) {
        super(node, 'Continue');
    }

    transformChildren(transform: TransformFunc): Continue {
        return this;
    }

    exportAsCode(): string {
        return `continue`;
    }
}

interface IfInterface extends NodeInterface {
    cond: ExpressionInterface;
    iffalse: BlockInterface | null;
    iftrue: BlockInterface;
}

export class If extends Node implements IfInterface {
    readonly _nodetype: 'If';
    readonly neverSimicolon: boolean = true;

    cond: Expression;
    iffalse: Block | null;
    iftrue: Block;

    constructor(node: IfInterface) {
        super(node, 'If');

        this.cond = expression(node.cond);
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

interface ExprListInterface extends NodeInterface {
    exprs: ExpressionInterface[];
}

export class ExprList extends Node implements ExprListInterface {
    readonly _nodetype: 'ExprList';

    exprs: Expression[];

    constructor(node: ExprListInterface) {
        super(node, 'ExprList');

        this.exprs = node.exprs.map(expression);
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

interface AssignmentInterface extends NodeInterface {
    lvalue: AstIDInterface | UnaryOpInterface |
            StructRefInterface | ArrayRefInterface;
    readonly op: string;
    rvalue: ExpressionInterface;
}

export class Assignment extends Node implements AssignmentInterface {
    readonly _nodetype: 'Assignment';

    lvalue: ID | UnaryOp | StructRef | ArrayRef;
    readonly op: string;
    rvalue: Expression;

    constructor(node: AssignmentInterface) {
        super(node, 'Assignment');

        this.lvalue = instantiate<
            ID | UnaryOp | StructRef | ArrayRef,
            AstIDInterface | UnaryOpInterface |
            StructRefInterface | ArrayRefInterface
        >(node.lvalue, ['ID', 'UnaryOp', 'StructRef', 'ArrayRef']);
        this.op = this.assertString(node.op);
        this.rvalue = expression(node.rvalue);
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

interface ReturnInterface extends NodeInterface {
    expr: ExpressionInterface;
}

export class Return extends Node implements ReturnInterface {
    readonly _nodetype: 'Return';

    expr: Expression;

    constructor(node: ReturnInterface) {
        super(node, 'Return');

        this.expr = expression(node.expr);
    }

    transformChildren(transform: TransformFunc): Return {
        this.expr = transform(this.expr, this);
        return this;
    }

    exportAsCode(): string {
        return `return ${this.expr.exportAsCode()}`;
    }
}

interface FileASTInterface extends NodeInterface {
    ext: Array<DeclInterface | FuncDefInterface>;
}

export class FileAST extends Node implements FileASTInterface {
    readonly _nodetype: 'FileAST';
    readonly neverSimicolon: true;

    ext: Array<Decl | FuncDef>;

    constructor(node: FileASTInterface) {
        super(node, 'FileAST');

        this.ext = node.ext.map(
            (node) => instantiate<
                Decl | FuncDef,
                DeclInterface | FuncDefInterface
            >(node, ['Decl', 'FuncDef'])
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

export function importAstFromJson(json: NodeInterface): FileAST {
    if (checkType<FileASTInterface>(json, 'FileAST')) {
        return new FileAST(json);
    } else {
        throw new Error('invalid JSON AST');
    }
}

function indentCode(code: string): string {
    return code
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n');
}

function checkType<T extends NodeInterface>(
    node: NodeInterface, name: string
): node is T {
    return node._nodetype === name;
}

function instantiate<T extends Node, I extends NodeInterface>(
    node: I, allowedTypes: string[]
): T {
    if (allowedTypes.indexOf(node._nodetype) === -1) {
        throw new Error(`unexpected ${node._nodetype}, ` +
                        `expected ${allowedTypes.join(', ')} ` +
                        `from ${node.coord}`);
    }

    if (checkType<DeclInterface>(node, 'Decl')) {
        return new Decl(node) as Node as T;
    }
    if (checkType<FuncDeclInterface>(node, 'FuncDecl')) {
        return new FuncDecl(node) as Node as T;
    }
    if (checkType<TypeDeclInterface>(node, 'TypeDecl')) {
        return new TypeDecl(node) as Node as T;
    }
    if (checkType<ArrayDeclInterface>(node, 'ArrayDecl')) {
        return new ArrayDecl(node) as Node as T;
    }
    if (checkType<PtrDeclInterface>(node, 'PtrDecl')) {
        return new PtrDecl(node) as Node as T;
    }
    if (checkType<InitListInterface>(node, 'InitList')) {
        return new InitList(node) as Node as T;
    }
    if (checkType<IdentifierTypeInterface>(node, 'IdentifierType')) {
        return new IdentifierType(node) as Node as T;
    }
    if (checkType<ParamListInterface>(node, 'ParamList')) {
        return new ParamList(node) as Node as T;
    }
    if (checkType<TypenameInterface>(node, 'Typename')) {
        return new Typename(node) as Node as T;
    }
    if (checkType<FuncDefInterface>(node, 'FuncDef')) {
        return new FuncDef(node) as Node as T;
    }
    if (checkType<CastInterface>(node, 'Cast')) {
        return new Cast(node) as Node as T;
    }
    if (checkType<UnaryOpInterface>(node, 'UnaryOp')) {
        return new UnaryOp(node) as Node as T;
    }
    if (checkType<BinaryOpInterface>(node, 'BinaryOp')) {
        return new BinaryOp(node) as Node as T;
    }
    if (checkType<TernaryOpInterface>(node, 'TernaryOp')) {
        return new TernaryOp(node) as Node as T;
    }
    if (checkType<ConstantInterface>(node, 'Constant')) {
        return new Constant(node) as Node as T;
    }
    if (checkType<AstIDInterface>(node, 'ID')) {
        return new ID(node) as Node as T;
    }
    if (checkType<StructRefInterface>(node, 'StructRef')) {
        return new StructRef(node) as Node as T;
    }
    if (checkType<ArrayRefInterface>(node, 'ArrayRef')) {
        return new ArrayRef(node) as Node as T;
    }
    if (checkType<FuncCallInterface>(node, 'FuncCall')) {
        return new FuncCall(node) as Node as T;
    }
    if (checkType<EmptyStatementInterface>(node, 'EmptyStatement')) {
        return new EmptyStatement(node) as Node as T;
    }
    if (checkType<LabelInterface>(node, 'Label')) {
        return new Label(node) as Node as T;
    }
    if (checkType<GotoInterface>(node, 'Goto')) {
        return new Goto(node) as Node as T;
    }
    if (checkType<CompoundInterface>(node, 'Compound')) {
        return new Compound(node) as Node as T;
    }
    if (checkType<WhileInterface>(node, 'While')) {
        return new While(node) as Node as T;
    }
    if (checkType<DoWhileInterface>(node, 'DoWhile')) {
        return new DoWhile(node) as Node as T;
    }
    if (checkType<ForInterface>(node, 'For')) {
        return new For(node) as Node as T;
    }
    if (checkType<SwitchInterface>(node, 'Switch')) {
        return new Switch(node) as Node as T;
    }
    if (checkType<DefaultInterface>(node, 'Default')) {
        return new Default(node) as Node as T;
    }
    if (checkType<CaseInterface>(node, 'Case')) {
        return new Case(node) as Node as T;
    }
    if (checkType<BreakInterface>(node, 'Break')) {
        return new Break(node) as Node as T;
    }
    if (checkType<ContinueInterface>(node, 'Continue')) {
        return new Continue(node) as Node as T;
    }
    if (checkType<IfInterface>(node, 'If')) {
        return new If(node) as Node as T;
    }
    if (checkType<ExprListInterface>(node, 'ExprList')) {
        return new ExprList(node) as Node as T;
    }
    if (checkType<AssignmentInterface>(node, 'Assignment')) {
        return new Assignment(node) as Node as T;
    }
    if (checkType<ReturnInterface>(node, 'Return')) {
        return new Return(node) as Node as T;
    }
    if (checkType<FileASTInterface>(node, 'FileAST')) {
        return new FileAST(node) as Node as T;
    }

    throw new Error('unreachable');
}
