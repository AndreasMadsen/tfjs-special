
import * as fs from 'fs';
import * as path from 'path';

const imports = fs.readdirSync(path.resolve(__dirname, '../kernels'))
    .filter((filename) => path.extname(filename) === '.ts')
    .map(function importString(filename) {
        const basename = path.basename(filename, '.ts');
        return `import './${basename}';`;
    })
    .join('\n') + '\n';

fs.writeFileSync(path.resolve(__dirname, '../kernels/index.ts'), imports);
