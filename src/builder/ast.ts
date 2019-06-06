
export type TransformFunc = (<T extends Node, TT extends Node>(child: T, parent: TT) => T);

declare type Language = 'WebGL' | 'JS';

export interface NodeInterface {
    readonly _nodetype: string;
    readonly coord: string | null;
}

export abstract class Node implements NodeInterface {
    readonly _nodetype: string;
    readonly neverSemicolon: boolean = false;
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

    exportAs(language: Language): string {
        switch (language) {
            case 'WebGL':
                return this.exportAsWebGL();
            case 'JS':
                return this.exportAsJS();
            default:
                throw new Error('unreachable');
        }
    }

    exportAsWebGL(): string {
        return this.exportAs('WebGL');
    }

    exportAsJS(): string {
        return this.exportAs('JS');
    }

    abstract transformChildren(transform: TransformFunc): this;

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

    getMaybeSemicolon(): string {
        return this.neverSemicolon ? '' : ';';
    }
}

export declare type AllDeclInterface = (
    DeclInterface | TypeDeclInterface | FuncDeclInterface |
    ArrayDeclInterface | PtrDeclInterface
);
export declare type AllDecl = Decl | TypeDecl | FuncDecl | ArrayDecl | PtrDecl;

export interface DeclInterface extends NodeInterface {
    readonly bitsize: null;
    readonly funcspec: Node[];
    init: InitListInterface | ConstantInterface |
          ArrayRefInterface | UnaryOpInterface | BinaryOpInterface |
          null;
    name: string;
    readonly quals: Node[];
    readonly storage: string[];
    type: AllDeclInterface;
}

export class Decl extends Node implements DeclInterface {
    readonly _nodetype: 'Decl';

    readonly bitsize: null;
    readonly funcspec: Node[];
    init: InitList | Constant | ArrayRef | UnaryOp | BinaryOp | null;
    name: string;
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
                InitList | Constant | ArrayRef | UnaryOp | BinaryOp,
                InitListInterface | ConstantInterface |
                ArrayRefInterface | UnaryOpInterface | BinaryOpInterface
            >(node.init, [
                'InitList', 'Constant', 'ArrayRef', 'UnaryOp', 'BinaryOp'
            ]);
        }

        this.name = this.assertString(node.name);
        this.quals = this.assertEmpty(node.quals);
        this.storage = node.storage;

        this.type = instantiate<
            AllDecl,
            AllDeclInterface
        >(node.type, ['Decl', 'TypeDecl', 'FuncDecl', 'ArrayDecl', 'PtrDecl']);
    }

    transformChildren(transform: TransformFunc) {
        if (this.init !== null) {
            this.init = transform(this.init, this);
        }
        this.type = transform(this.type, this);

        return this;
    }

    exportAsWebGL(): string {
        const stroage = this.storage.join(' ');
        const type = this.type.exportAsWebGL();
        const init = this.init === null ? '' : `= ${this.init.exportAsWebGL()}`;

        return `${stroage} ${type} ${init}`.trim();
    }

    exportAsJS(): string {
        const type = this.type.exportAsJS();
        const init = this.init === null ? '' : `= ${this.init.exportAsJS()}`;

        if (this.type instanceof FuncDecl) {
            return `function ${type} ${init}`.trim();
        } else {
            return `let ${type} ${init}`.trim();
        }
    }
}

export interface DeclListInterface extends NodeInterface {
    decls: DeclInterface[];
}

export class DeclList extends Node implements DeclListInterface {
    readonly _nodetype: 'DeclList';

    decls: Decl[];

    constructor(node: DeclListInterface) {
        super(node, 'DeclList');

        this.decls = node.decls.map((decl) => new Decl(decl));
    }

    transformChildren(transform: TransformFunc) {
        this.decls = this.decls.map((decl) => transform(decl, this));

        return this;
    }

    exportAs(language: Language): string {
        return this.decls
            .map((decl) => decl.exportAs(language))
            .join(', ');
    }
}

export interface FuncDeclInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        if (this.args !== null) {
            this.args = transform(this.args, this);
        }
        this.type = transform(this.type, this);

        return this;
    }

    exportAsWebGL() {
        let args = '()';
        if (this.args !== null) {
            args = this.args.exportAsWebGL();
        }

        return `${this.type.exportAsWebGL()}${args}`;
    }

    exportAsJS() {
        let args = '()';
        if (this.args !== null) {
            args = this.args.exportAsJS();
        }

        return `${this.type.exportAsJS()}${args}`;
    }
}

export interface TypeDeclInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.type = transform(this.type, this);
        return this;
    }

    getTypeString(): string {
        return this.type.getTypeString();
    }

    getName(): string {
        return this.declname || '';
    }

    exportAsWebGL(): string {
        return `${this.type.getTypeString()} ${this.getName()}`.trim();
    }

    exportAsJS(): string {
        return `${this.getName()}`.trim();
    }
}

export interface ArrayDeclInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        if (this.dim !== null) {
            this.dim = transform(this.dim, this);
        }
        this.type = transform(this.type, this);
        return this;
    }

    getArraySizeString(): string {
        return this.dim === null ? '' : this.dim.value;
    }

    exportAsWebGL(): string {
        const type = this.type.exportAsWebGL();
        return `${type}[${this.getArraySizeString()}]`;
    }

    exportAsJS(): string {
        const type = this.type.exportAsJS();
        return `${type}[]`;
    }
}

export interface PtrDeclInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.type = transform(this.type, this);
        return this;
    }

    exportAsWebGL() {
        const name = this.type.getName();
        return `${this.type.getTypeString()}*${name === '' ? '' : ' ' + name}`;
    }

    exportAsJS() {
        const name = this.type.getName();
        return `${name}: Ptr<${this.type.getTypeString()}>`;
    }
}

export interface InitListInterface extends NodeInterface {
    exprs: ExpressionInterface[];
}

export class InitList extends Node implements InitListInterface {
    readonly _nodetype: 'InitList';

    exprs: Expression[];

    constructor(node: InitListInterface) {
        super(node, 'InitList');

        this.exprs = node.exprs.map(expression);
    }

    transformChildren(transform: TransformFunc) {
        this.exprs = this.exprs.map((expr) => transform(expr, this));
        return this;
    }

    exportAsWebGL(): string {
        const values = this.exprs
            .map((expr) => expr.exportAsWebGL())
            .join(', ');
        return '{' + values + '}';
    }

    exportAsJS(): string {
        const values = this.exprs
            .map((expr) => expr.exportAsJS())
            .join(', ');
        return '[' + values + ']';
    }
}

export interface IdentifierTypeInterface extends NodeInterface {
    readonly names: string[];
}

export class IdentifierType extends Node implements IdentifierTypeInterface {
    readonly _nodetype: 'IdentifierType';

    readonly names: string[];

    constructor(node: IdentifierTypeInterface) {
        super(node, 'IdentifierType');

        this.names = node.names;
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    getTypeString(): string {
        return this.names.join(' ');
    }

    exportAs(language: Language): string {
        return this.getTypeString();
    }
}

export interface ParamListInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.params = this.params.map((param) => transform(param, this));
        return this;
    }

    exportAs(language: Language): string {
        const params = this.params
            .map((param) => param.exportAs(language)).join(', ');
        return `(${params})`;
    }
}

export interface TypenameInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.type = transform(this.type, this);
        return this;
    }

    exportAs(language: Language): string {
        return this.type.exportAs(language);
    }
}

export interface FuncDefInterface extends NodeInterface {
    body: CompoundInterface;
    decl: DeclInterface;
    // tslint:disable-next-line:variable-name
    param_decls: DeclInterface[] | null; // Old-style K&R C   :(
}

export class FuncDef extends Node implements FuncDefInterface {
    readonly _nodetype: 'FuncDef';
    readonly neverSemicolon: boolean = true;

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

    transformChildren(transform: TransformFunc) {
        this.body = transform(this.body, this);
        this.decl = transform(this.decl, this);
        if (this.param_decls !== null) {
            this.param_decls = this.param_decls
                .map((decl) => transform(decl, this));
        }
        return this;
    }

    exportAsWebGL(): string {
        const body = this.body.exportAsWebGL();
        const decl = this.decl.exportAsWebGL();
        let decls = '';
        if (this.param_decls !== null) {
            decls = ' ' + this.param_decls
                .map((decl) => decl.exportAsWebGL())
                .join(', ');
        }

        return `${decl}${decls} ${body}`;
    }

    exportAsJS(): string {
        const body = this.body.exportAsJS();
        const decl = this.decl.exportAsJS();
        return `${decl} ${body}`;
    }
}

export interface CastInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.expr = transform(this.expr, this);
        this.to_type = transform(this.to_type, this);
        return this;
    }

    exportAsWebGL(): string {
        return `(${this.to_type.exportAsWebGL()})${this.expr.exportAsWebGL()}`;
    }

    exportAsJS(): string {
        return `Cast<${this.to_type.exportAsJS()}>(${this.expr.exportAsJS()})`;
    }
}

export interface UnaryOpInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.expr = transform(this.expr, this);
        return this;
    }

    exportAs(language: Language): string {
        switch (this.op) {
            case 'p++':
                return `${this.expr.exportAs(language)}++`;
            case '++p':
                return `++${this.expr.exportAs(language)}`;
            default:
                return `${this.op}${this.expr.exportAs(language)}`;
        }
    }
}

export interface BinaryOpInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.left = transform(this.left, this);
        this.right = transform(this.right, this);
        return this;
    }

    exportAsWebGL(): string {
        const left = this.left.exportAsWebGL();
        const right = this.right.exportAsWebGL();
        return `(${left} ${this.op} ${right})`;
    }

    exportAsJS(): string {
        const left = this.left.exportAsJS();
        const right = this.right.exportAsJS();
        switch (this.op) {
            case '==':
                return `(${left} === ${right})`;
            case '!=':
                return `(${left} !== ${right})`;
            default:
                return `(${left} ${this.op} ${right})`;
        }
    }
}

export interface TernaryOpInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.cond = transform(this.cond, this);
        this.iffalse = transform(this.iffalse, this);
        this.iftrue = transform(this.iftrue, this);
        return this;
    }

    exportAs(language: Language): string {
        const cond = this.cond.exportAs(language);
        const iffalse = this.iffalse.exportAs(language);
        const iftrue = this.iftrue.exportAs(language);

        return `(${cond} ? ${iftrue} : ${iffalse})`;
    }
}

export interface ConstantInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAs(language: Language): string {
        return this.value;
    }
}

export interface AstIDInterface extends NodeInterface {
    name: string;
}

export class ID extends Node implements AstIDInterface {
    readonly _nodetype: 'ID';

    name: string;

    constructor(node: AstIDInterface) {
        super(node, 'ID');

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAs(language: Language): string {
        return this.name;
    }
}

export interface StructRefInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.field = transform(this.field, this);
        this.name = transform(this.name, this);
        return this;
    }

    exportAs(language: Language): string {
        const field = this.field.exportAs(language);
        return `${this.name.exportAs(language)}.${field}`;
    }
}

export interface ArrayRefInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.name = transform(this.name, this);
        this.subscript = transform(this.subscript, this);
        return this;
    }

    exportAs(language: Language): string {
        const subscript = this.subscript.exportAs(language);
        return `${this.name.exportAs(language)}[${subscript}]`;
    }
}

export interface FuncCallInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.name = transform(this.name, this);
        if (this.args !== null) {
            this.args = transform(this.args, this);
        }
        return this;
    }

    exportAs(language: Language): string {
        let args = '';
        if (this.args !== null) {
            args = this.args.exportAs(language);
        }
        return `${this.name.exportAs(language)}${args}`;
    }
}

export interface EmptyStatementInterface extends NodeInterface {}

export class EmptyStatement extends Node implements EmptyStatementInterface {
    readonly _nodetype: 'EmptyStatement';

    constructor(node: EmptyStatementInterface) {
        super(node, 'EmptyStatement');
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAs(language: Language): string {
        return '';
    }
}

export declare type ExpressionInterface = (
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

export declare type CompoundItemInterface = (
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

export declare type BlockInterface = CompoundInterface | CompoundItemInterface;

export declare type Block = Compound | CompoundItem;

function block(node: BlockInterface): Block {
    if (checkType<CompoundInterface>(node, 'Compound')) {
        return new Compound(node);
    } else {
        return compoundItem(node);
    }
}

export interface LabelInterface extends NodeInterface {
    readonly name: string;
    stmt: CompoundItemInterface;
}

export class Label extends Node implements LabelInterface {
    readonly _nodetype: 'Label';
    readonly neverSemicolon: boolean = true;

    readonly name: string;
    stmt: CompoundItem;

    constructor(node: LabelInterface) {
        super(node, 'Label');

        this.name = this.assertString(node.name);
        this.stmt = compoundItem(node.stmt);
    }

    transformChildren(transform: TransformFunc) {
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAs(language: Language): string {
        return `${this.name}: ${this.stmt.exportAs(language)}` +
               `${this.stmt.getMaybeSemicolon()}`;
    }
}

export interface GotoInterface extends NodeInterface {
    readonly name: string;
}

export class Goto extends Node implements GotoInterface {
    readonly _nodetype: 'Goto';

    readonly name: string;

    constructor(node: GotoInterface) {
        super(node, 'Goto');

        this.name = this.assertString(node.name);
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAsWebGL(): string {
        return `goto ${this.name}`;
    }

    exportAsJS(): string {
        return `Goto(${this.name})`;
    }
}

export interface CompoundInterface extends NodeInterface {
    // tslint:disable-next-line:variable-name
    block_items: CompoundItemInterface[];
}

export class Compound extends Node implements CompoundInterface {
    readonly _nodetype: 'Compound';
    readonly neverSemicolon: boolean = true;

    // tslint:disable-next-line:variable-name
    block_items: CompoundItem[];

    constructor(node: CompoundInterface) {
        super(node, 'Compound');

        this.block_items = node.block_items
            .map((node: Node) => compoundItem(node));
    }

    transformChildren(transform: TransformFunc) {
        const newContent = [];
        // if transform() returns a Compund flatten it into this Compund
        for (const item of this.block_items) {
            const itemTransform = transform(item, this);
            if (itemTransform instanceof Compound) {
                newContent.push(...itemTransform.block_items);
            } else {
                newContent.push(itemTransform);
            }
        }
        this.block_items = newContent;

        return this;
    }

    exportAs(language: Language): string {
        const items = this.block_items.map((item) => (
            indentCode(item.exportAs(language)) +
            item.getMaybeSemicolon()
        ));

        return '{\n' +
                items.join('\n') + '\n' +
                '}';
    }
}

export interface WhileInterface extends NodeInterface {
    cond: ExpressionInterface;
    stmt: BlockInterface;
}

export class While extends Node implements WhileInterface {
    readonly _nodetype: 'While';
    readonly neverSemicolon: boolean = true;

    cond: Expression;
    stmt: Block;

    constructor(node: WhileInterface) {
        super(node, 'While');

        this.cond = expression(node.cond);
        this.stmt = block(node.stmt);
    }

    transformChildren(transform: TransformFunc) {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAs(language: Language): string {
        const cond = this.cond.exportAs(language);
        const stmt = this.stmt.exportAs(language);
        return `while(${cond}) ${stmt}\n`;
    }
}

export interface DoWhileInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAs(language: Language): string {
        const cond = this.cond.exportAs(language);
        const stmt = this.stmt.exportAs(language);
        return `do ${stmt} while(${cond})`;
    }
}

export interface ForInterface extends NodeInterface {
    init: AssignmentInterface | DeclInterface | DeclListInterface;
    next: ExpressionInterface;
    cond: ExpressionInterface;
    stmt: BlockInterface;
}

export class For extends Node implements ForInterface {
    readonly neverSemicolon: boolean = true;
    readonly _nodetype: 'For';

    init: Assignment | Decl | DeclList;
    next: Expression;
    cond: Expression;
    stmt: Block;

    constructor(node: ForInterface) {
        super(node, 'For');

        this.init = instantiate<
            Assignment | Decl | DeclList,
            AssignmentInterface | DeclInterface | DeclListInterface
        >(node.init, ['Assignment', 'Decl', 'DeclList']);
        this.next = expression(node.next);
        this.cond = expression(node.cond);
        this.stmt = block(node.stmt);
    }

    transformChildren(transform: TransformFunc) {
        this.init = transform(this.init, this);
        this.next = transform(this.next, this);
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAs(language: Language): string {
        const init = this.init.exportAs(language);
        const next = this.next.exportAs(language);
        const cond = this.cond.exportAs(language);
        const stmt = this.stmt.exportAs(language) +
                     this.stmt.getMaybeSemicolon();
        return `for (${init}; ${cond}; ${next}) ${stmt}\n`;
    }
}

export interface SwitchInterface extends NodeInterface {
    cond: ExpressionInterface;
    stmt: CompoundInterface;
}

export class Switch extends Node implements SwitchInterface {
    readonly neverSemicolon: boolean = true;
    readonly _nodetype: 'Switch';

    cond: Expression;
    stmt: Compound;

    constructor(node: SwitchInterface) {
        super(node, 'Switch');

        this.cond = expression(node.cond);
        this.stmt = new Compound(node.stmt);
    }

    transformChildren(transform: TransformFunc) {
        this.cond = transform(this.cond, this);
        this.stmt = transform(this.stmt, this);
        return this;
    }

    exportAs(language: Language): string {
        const cond = this.cond.exportAs(language);
        const stmt = this.stmt.exportAs(language);
        return `swtich(${cond}) ${stmt}\n`;
    }
}

export interface DefaultInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        if (this.stmts !== null) {
            this.stmts = this.stmts
                .map((stmt) => transform(stmt, this));
        }
        return this;
    }

    exportAs(language: Language): string {
        let stmts = '';
        if (this.stmts !== null) {
            stmts = this.stmts
                .map((stmt) => (
                    indentCode(stmt.exportAs(language)) +
                    stmt.getMaybeSemicolon()
                ))
                .join('\n');
        }
        return `default:\n` +
               `${stmts}`;
    }
}

export interface CaseInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.expr = transform(this.expr, this);
        if (this.stmts !== null) {
            this.stmts = this.stmts
                .map((stmt) => transform(stmt, this));
        }
        return this;
    }

    exportAs(language: Language): string {
        let stmts = '';
        if (this.stmts !== null) {
            stmts = this.stmts
            .map((stmt) => (
                indentCode(stmt.exportAs(language)) +
                stmt.getMaybeSemicolon()
            ))
            .join('\n');
        }
        return `case ${this.expr.exportAs(language)}:\n` +
               `${stmts}`;
    }
}

export interface BreakInterface extends NodeInterface {}

export class Break extends Node implements BreakInterface {
    readonly _nodetype: 'Break';

    constructor(node: BreakInterface) {
        super(node, 'Break');
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAs(language: Language): string {
        return `break`;
    }
}

export interface ContinueInterface extends NodeInterface {}

export class Continue extends Node implements ContinueInterface {
    readonly _nodetype: 'Continue';

    constructor(node: ContinueInterface) {
        super(node, 'Continue');
    }

    transformChildren(transform: TransformFunc) {
        return this;
    }

    exportAs(language: Language): string {
        return `continue`;
    }
}

export interface IfInterface extends NodeInterface {
    cond: ExpressionInterface;
    iffalse: BlockInterface | null;
    iftrue: BlockInterface;
}

export class If extends Node implements IfInterface {
    readonly _nodetype: 'If';
    readonly neverSemicolon: boolean = true;

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

    transformChildren(transform: TransformFunc) {
        this.cond = transform(this.cond, this);
        if (this.iffalse !== null) {
            this.iffalse = transform(this.iffalse, this);
        }
        this.iftrue = transform(this.iftrue, this);
        return this;
    }

    exportAs(language: Language): string {
        const cond = this.cond.exportAs(language);

        const iftrue = (
            this.iftrue.exportAs(language) +
            this.iftrue.getMaybeSemicolon()
        );

        let elseblock = '';
        if (this.iffalse !== null) {
            elseblock = (
                ' else ' + this.iffalse.exportAs(language) +
                this.iffalse.getMaybeSemicolon()
            );
        }

        return `if (${cond}) ${iftrue}${elseblock}`;
    }
}

export interface ExprListInterface extends NodeInterface {
    exprs: ExpressionInterface[];
}

export class ExprList extends Node implements ExprListInterface {
    readonly _nodetype: 'ExprList';

    exprs: Expression[];

    constructor(node: ExprListInterface) {
        super(node, 'ExprList');

        this.exprs = node.exprs.map(expression);
    }

    transformChildren(transform: TransformFunc) {
        this.exprs = this.exprs
            .map((expr) => transform(expr, this));
        return this;
    }

    exportAs(language: Language): string {
        const exprs = this.exprs.map((expr) => expr.exportAs(language));
        return `(${exprs.join(', ')})`;
    }
}

export interface AssignmentInterface extends NodeInterface {
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

    transformChildren(transform: TransformFunc) {
        this.lvalue = transform(this.lvalue, this);
        this.rvalue = transform(this.rvalue, this);
        return this;
    }

    exportAs(language: Language): string {
        const lvalue = this.lvalue.exportAs(language);
        const rvalue = this.rvalue.exportAs(language);
        return `${lvalue} ${this.op} ${rvalue}`;
    }
}

export interface ReturnInterface extends NodeInterface {
    expr: ExpressionInterface;
}

export class Return extends Node implements ReturnInterface {
    readonly _nodetype: 'Return';

    expr: Expression;

    constructor(node: ReturnInterface) {
        super(node, 'Return');

        this.expr = expression(node.expr);
    }

    transformChildren(transform: TransformFunc) {
        this.expr = transform(this.expr, this);
        return this;
    }

    exportAs(language: Language): string {
        return `return ${this.expr.exportAs(language)}`;
    }
}

export interface FileASTInterface extends NodeInterface {
    ext: Array<DeclInterface | FuncDefInterface>;
}

export class FileAST extends Node implements FileASTInterface {
    readonly _nodetype: 'FileAST';
    readonly neverSemicolon: boolean = true;

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

    transformChildren(transform: TransformFunc) {
        // if transform() returns a Compund flatten it into the FileAST
        const newContent: Array<Decl | FuncDef> = [];
        for (const item of this.ext) {
            const itemTransform = transform(item, this);
            if (itemTransform instanceof Compound) {
                for (const item of itemTransform.block_items) {
                    if (item instanceof Decl || item instanceof FuncDef) {
                        newContent.push(item);
                    } else {
                        throw new Error(
                            'Forbidding Compound content for FileAST');
                    }
                }
            } else {
                newContent.push(itemTransform);
            }
        }
        this.ext = newContent;
        return this;
    }

    exportAs(language: Language): string {
        const ext = this.ext.map((node) => (
            node.exportAs(language) + node.getMaybeSemicolon()
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
    if (checkType<DeclListInterface>(node, 'DeclList')) {
        return new DeclList(node) as Node as T;
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
