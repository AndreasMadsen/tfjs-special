
interface BaseInterface {
    name: string;
}

abstract class Base implements BaseInterface {
    abstract readonly name: string;

    abstract dummy(): string;
}

interface AInterface extends BaseInterface {
    name: 'A';
    propertyA: string;
}

class A implements AInterface {
    name: 'A';
    propertyA: string;

    constructor(node: AInterface) {
        this.propertyA = node.propertyA;
    }

    dummy(): string {
        return 'A';
    }
}

interface BInterface extends BaseInterface {
    name: 'B';
    propertyB: string;
}

class B implements BInterface {
    name: 'B';
    propertyB: string;

    constructor(node: BInterface) {
        this.propertyB = node.propertyB;
    }

    dummy(): string {
        return 'B';
    }
}

function checkType<T extends BaseInterface>(
    node: BaseInterface, name: string
): node is T {
    return node.name === name;
}

function unreachable(): never {
    throw new Error('unreachable');
}

function instantiate<T extends Base,  I extends BaseInterface>(
    node: I, allowedTypes: string[]
): T {
    if (allowedTypes.indexOf(node.name) !== -1) {
        throw new Error('bad type');
    }

    if (checkType<AInterface>(node, 'A')) {
        return new A(node) as Base as T;
    }
    if (checkType<BInterface>(node, 'B')) {
        return new B(node) as Base as T;
    }

    throw unreachable();
}

const parsed = instantiate<A | B, AInterface | BInterface>(
    { name: 'A', propertyA: 'value' }, ['A', 'B']
);
console.log(parsed);
