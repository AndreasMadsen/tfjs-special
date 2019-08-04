
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as marked from 'marked';
import * as katex from 'katex';

const docs = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'docs', 'api.json'), 'utf8')
);
const source = fs.readFileSync(path.resolve(__dirname, 'api.hbs'), 'utf8');

handlebars.registerHelper('description', function render(comment, options) {
    // Create code description
    let text = comment.shortText + '\n' + comment.text;

    // Convert LaTeX $$ $$ to display-mode KaTeX
    let position = 0;
    while ((position = text.indexOf('$$', position)) !== -1) {
        const start = position + 2;
        const end = text.indexOf('$$', start);

        const latex = text.slice(start, end);
        text = text.slice(0, position) +
            katex.renderToString(latex, {
                displayMode: true,
                throwOnError: false
            }) +
            text.slice(end + 2);

        position = end + 2;
    }

    // Convert LaTeX $ $ to display-mode KaTeX
    position = 0;
    while ((position = text.indexOf('$', position)) !== -1) {
        const start = position + 1;
        const end = text.indexOf('$', start);

        const latex = text.slice(start, end);
        text = text.slice(0, position) +
            katex.renderToString(latex, {
                displayMode: false,
                throwOnError: false
            }) +
            text.slice(end + 1);

        position = end + 1;
    }

    // render markdown
    text = marked(text);

    return text;
});

const template = handlebars.compile(source);

fs.writeFileSync(
    path.resolve(__dirname, '..', 'docs', 'index.html'),
    template(docs)
);
