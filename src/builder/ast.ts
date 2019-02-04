
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

class Decl extends Node {
    readonly _nodetype: 'Decl';

    readonly bitsize: null;
    readonly funcspec: Node[];
    readonly init: InitList | Constant | UnaryOp | null;
    readonly name: string;
    readonly quals: Node[];
    readonly storage: string[];
    readonly type: Decl | TypeDecl | FuncDecl | ArrayDecl | PtrDecl;

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

    exportAsCode(): string {
        const stroage = this.storage.join(' ');
        const type = this.type.exportAsCode();
        const init = this.init === null ? '' : `= ${this.init.exportAsCode()}`;

        return `${stroage} ${type} ${init}`.trim();
    }
}

class FuncDecl extends Node {
    readonly _nodetype: 'FuncDecl';

    readonly args: ParamList | null;
    readonly type: TypeDecl;

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

    exportAsCode() {
        let args = '()';
        if (this.args !== null) {
            args = this.args.exportAsCode();
        }

        return `${this.type.exportAsCode()}${args}`;
    }
}

class TypeDecl extends Node {
    readonly _nodetype: 'TypeDecl';

    readonly declname: string | null;
    readonly quals: Node[];
    readonly type: IdentifierType;

    constructor(json: Node) {
        super(json, 'TypeDecl');
        const node = json as TypeDecl;

        this.declname = node.declname;
        this.quals = this.assertEmpty(node.quals);
        this.type = new IdentifierType(node.type);
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

class ArrayDecl extends Node {
    readonly _nodetype: 'ArrayDecl';

    readonly dim: Constant | null;
    // tslint:disable-next-line:variable-name
    readonly dim_quals: Node[];
    readonly type: TypeDecl;

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

    exportAsCode(): string {
        const type = this.type.exportAsCode();
        return `${type}[${this.dim === null ? '' : this.dim.exportAsCode()}]`;
    }
}

class PtrDecl extends Node {
    readonly _nodetype: 'PtrDecl';

    readonly quals: Node[];
    readonly type: TypeDecl;

    constructor(json: Node) {
        super(json, 'PtrDecl');
        const node = json as PtrDecl;

        this.quals = this.assertEmpty(node.quals);
        this.type = new TypeDecl(node.type as Node);
    }

    exportAsCode() {
        return `${this.type.getType()}* ${this.type.getName()}`;
    }
}

class InitList extends Node {
    readonly _nodetype: 'InitList';

    exprs: Expression[];

    constructor(json: Node) {
        super(json, 'InitList');
        const node = json as InitList;

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }

    exportAsCode(): string {
        const values = this.exprs.map((expr) => expr.exportAsCode()).join(', ');
        return '{' + values + '}';
    }
}

class IdentifierType extends Node {
    readonly _nodetype: 'IdentifierType';

    readonly names: string[];

    constructor(json: Node) {
        super(json, 'IdentifierType');
        const node = json as IdentifierType;

        this.names = node.names;
    }

    exportAsCode(): string {
        return this.names.join(' ');
    }
}

class ParamList extends Node {
    readonly _nodetype: 'ParamList';

    readonly params: Array<Typename | Decl | ID>;

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

    exportAsCode(): string {
        const params = this.params
            .map((param) => param.exportAsCode()).join(', ');
        return `(${params})`;
    }
}

class Typename extends Node {
    readonly _nodetype: 'Typename';

    readonly name: null;
    readonly quals: Node[];
    readonly type: TypeDecl | PtrDecl;

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

    exportAsCode(): string {
        return this.type.exportAsCode();
    }
}

class FuncDef extends Node {
    readonly _nodetype: 'FuncDef';
    readonly neverSimicolon: true;

    readonly body: Compound;
    readonly decl: Decl;
    // tslint:disable-next-line:variable-name
    readonly param_decls: Decl[] | null; // Old-style K&R C   :(

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

class Cast extends Node {
    readonly _nodetype: 'Cast';

    readonly expr: Expression;
    // tslint:disable-next-line:variable-name
    readonly to_type: Typename;

    constructor(json: Node) {
        super(json, 'Cast');
        const node = json as Cast;

        this.expr = expression(node.expr as Node);
        this.to_type = new Typename(node.to_type as Node);
    }

    exportAsCode(): string {
        return `(${this.to_type.exportAsCode()})${this.expr.exportAsCode()}`;
    }
}

class UnaryOp extends Node {
    readonly _nodetype: 'UnaryOp';

    readonly expr: Expression;
    readonly op: string;

    constructor(json: Node) {
        super(json, 'UnaryOp');
        const node = json as UnaryOp;

        this.expr = expression(node.expr as Node);
        this.op = this.assertString(node.op);
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

class BinaryOp extends Node {
    readonly _nodetype: 'BinaryOp';

    readonly left: Expression;
    readonly op: string;
    readonly right: Expression;

    constructor(json: Node) {
        super(json, 'BinaryOp');
        const node = json as BinaryOp;

        this.left = expression(node.left as Node);
        this.op = this.assertString(node.op);
        this.right = expression(node.right as Node);
    }

    exportAsCode(): string {
        const left = this.left.exportAsCode();
        const right = this.right.exportAsCode();
        return `(${left} ${this.op} ${right})`;
    }
}

class TernaryOp extends Node {
    readonly _nodetype: 'TernaryOp';

    readonly cond: Expression;
    readonly iffalse: Expression;
    readonly iftrue: Expression;

    constructor(json: Node) {
        super(json, 'TernaryOp');
        const node = json as TernaryOp;

        this.cond = expression(node.cond as Node);
        this.iffalse = expression(node.iffalse as Node);
        this.iftrue = expression(node.iftrue as Node);
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const iffalse = this.iffalse.exportAsCode();
        const iftrue = this.iftrue.exportAsCode();

        return `(${cond} ? ${iftrue} : ${iffalse})`;
    }
}

class Constant extends Node {
    readonly _nodetype: 'Constant';

    readonly type: string;
    readonly value: string;

    constructor(json: Node) {
        super(json, 'Constant');
        const node = json as Constant;

        this.type = this.assertString(node.type);
        this.value = this.assertString(node.value);
    }

    exportAsCode(): string {
        return this.value;
    }
}

class ID extends Node {
    readonly _nodetype: 'ID';

    readonly name: string;

    constructor(json: Node) {
        super(json, 'ID');
        const node = json as ID;

        this.name = this.assertString(node.name);
    }

    exportAsCode(): string {
        return this.name;
    }
}

class StructRef extends Node {
    readonly _nodetype: 'StructRef';

    readonly field: ID;
    readonly name: ID;
    readonly type: string;

    constructor(json: Node) {
        super(json, 'StructRef');
        const node = json as StructRef;

        this.field = node.field;
        this.name = node.name;
        this.type = node.type;
    }

    exportAsCode(): string {
        return `${this.name.exportAsCode()}.${this.field.exportAsCode()}`;
    }
}

class ArrayRef extends Node {
    readonly _nodetype: 'ArrayRef';

    readonly name: ID | StructRef;
    readonly subscript: Expression;

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

    exportAsCode(): string {
        return `${this.name.exportAsCode()}[${this.subscript.exportAsCode()}]`;
    }
}

class FuncCall extends Node {
    readonly _nodetype: 'FuncCall';

    readonly name: ID;
    readonly args: ExprList | null;

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

    exportAsCode(): string {
        let args = '';
        if (this.args !== null) {
            args = this.args.exportAsCode();
        }
        return `${this.name.exportAsCode()}${args}`;
    }
}

class EmptyStatement extends Node {
    readonly _nodetype: 'EmptyStatement';

    constructor(json: Node) {
        super(json, 'EmptyStatement');
    }

    exportAsCode(): string {
        return '';
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
    readonly _nodetype: 'Label';

    readonly name: string;
    readonly stmt: Block;

    constructor(json: Node) {
        super(json, 'Label');
        const node = json as Label;

        this.name = this.assertString(node.name);
        this.stmt = block(node.stmt as Node);
    }

    exportAsCode(): string {
        return `${this.name}: ${this.stmt.exportAsCode()}`;
    }
}

class Goto extends Node {
    readonly _nodetype: 'Goto';

    readonly name: string;

    constructor(json: Node) {
        super(json, 'Goto');
        const node = json as Goto;

        this.name = this.assertString(node.name);
    }

    exportAsCode(): string {
        return `goto ${this.name}`;
    }
}

class Compound extends Node {
    readonly _nodetype: 'Compound';
    readonly neverSimicolon: boolean = true;

    // tslint:disable-next-line:variable-name
    readonly block_items: CompoundItem[];

    constructor(json: Node) {
        super(json, 'Compound');
        const node = json as Compound;

        this.block_items = node.block_items
            .map((node: Node) => compoundItem(node));
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

class While extends Node {
    readonly _nodetype: 'While';
    readonly neverSimicolon: boolean = true;

    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        super(json, 'While');
        const node = json as While;

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `while(${cond}) ${stmt}\n`;
    }
}

class DoWhile extends Node {
    readonly neverSimicolon: boolean = true;
    readonly _nodetype: 'DoWhile';

    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        super(json, 'DoWhile');
        const node = json as DoWhile;

        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `do ${stmt} while(${cond})\n`;
    }
}

class For extends Node {
    readonly neverSimicolon: boolean = true;
    readonly _nodetype: 'For';

    readonly init: Assignment;
    readonly next: Expression;
    readonly cond: Expression;
    readonly stmt: Block;

    constructor(json: Node) {
        super(json, 'For');
        const node = json as For;

        this.init = new Assignment(node.init as Node);
        this.next = expression(node.next as Node);
        this.cond = expression(node.cond as Node);
        this.stmt = block(node.stmt as Node);
    }

    exportAsCode(): string {
        const init = this.init.exportAsCode();
        const next = this.next.exportAsCode();
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `for (${init}; ${cond}; ${next}) ${stmt}\n`;
    }
}

class Switch extends Node {
    readonly neverSimicolon: true;
    readonly _nodetype: 'Switch';

    readonly cond: Expression;
    readonly stmt: Compound;

    constructor(json: Node) {
        super(json, 'Switch');
        const node = json as Switch;

        this.cond = expression(node.cond as Node);
        this.stmt = new Compound(node.stmt as Node);
    }

    exportAsCode(): string {
        const cond = this.cond.exportAsCode();
        const stmt = this.stmt.exportAsCode();
        return `swtich(${cond}) ${stmt}\n`;
    }
}

class Default extends Node {
    readonly _nodetype: 'Default';

    readonly stmts: CompoundItem[] | null;

    constructor(json: Node) {
        super(json, 'Default');
        const node = json as Default;

        if (node.stmts === null) {
            this.stmts = null;
        } else {
            this.stmts = node.stmts.map((node: Node) => compoundItem(node));
        }
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

class Case extends Node {
    readonly _nodetype: 'Case';

    readonly expr: Expression;
    readonly stmts: CompoundItem[] | null;

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

class Break extends Node {
    readonly _nodetype: 'Break';

    constructor(json: Node) {
        super(json, 'Break');
    }

    exportAsCode(): string {
        return `break`;
    }
}

class Continue extends Node {
    readonly _nodetype: 'Continue';

    constructor(json: Node) {
        super(json, 'Continue');
    }

    exportAsCode(): string {
        return `continue`;
    }
}

class If extends Node {
    readonly _nodetype: 'If';
    readonly neverSimicolon: boolean = true;

    readonly cond: Expression;
    readonly iffalse: Block | null;
    readonly iftrue: Block;

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

class ExprList extends Node {
    readonly _nodetype: 'ExprList';

    readonly exprs: Expression[];

    constructor(json: Node) {
        super(json, 'ExprList');
        const node = json as ExprList;

        this.exprs = node.exprs.map((node: Node) => expression(node));
    }

    exportAsCode(): string {
        const exprs = this.exprs.map((expr) => expr.exportAsCode());
        return `(${exprs.join(', ')})`;
    }
}

class Assignment extends Node {
    readonly _nodetype: 'Assignment';

    readonly lvalue: ID | UnaryOp | StructRef | ArrayRef;
    readonly op: string;
    readonly rvalue: Expression;

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

    exportAsCode(): string {
        const lvalue = this.lvalue.exportAsCode();
        const rvalue = this.rvalue.exportAsCode();
        return `${lvalue} ${this.op} ${rvalue}`;
    }
}

class Return extends Node {
    readonly _nodetype: 'Return';

    readonly expr: Expression;

    constructor(json: Node) {
        super(json, 'Return');
        const node = json as Return;

        this.expr = expression(node.expr as Node);
    }

    exportAsCode(): string {
        return `return ${this.expr.exportAsCode()}`;
    }
}

class FileAST extends Node {
    readonly _nodetype: 'FileAST';
    readonly neverSimicolon: true;

    readonly ext: Array<Decl | FuncDef>;

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

    exportAsCode(): string {
        const ext = this.ext.map(function map(node): string {
            if (node instanceof Decl) {
                return `${node.exportAsCode()};\n`;
            } else if (node instanceof FuncDef) {
                return `${node.exportAsCode()}\n`;
            } else {
                return unreachable();
            }
        });

        return ext.join('\n');
    }
}

function unsupportedType(node: Node): Error {
    return new Error(`unknown nodetype ${node._nodetype}, from ${node.coord}`);
}

export function convertToTypedAST(node: Node) {
    return new FileAST(node);
}

function unreachable(): never {
    throw new Error('unreachable');
}

function indentCode(code: string): string {
    return code
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n');
}