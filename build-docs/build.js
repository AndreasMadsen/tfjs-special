
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const marked = require('marked');
const katex = require('katex');

function getTags(comment) {
    const tags = new Map(
        comment.tags.map(({tag, text}) => [tag, text])
    );

    return {
        category: tags.get('category').trim(),
        order:  parseInt(tags.get('order'), 10)
    };
}

const docs = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'docs', 'api.json'), 'utf8')
);
docs.children = docs.children
    .filter((child) => child.flags.isPublic)
    .sort(function order(a, b) {
        const aTags = getTags(a.signatures[0].comment);
        const bTags = getTags(b.signatures[0].comment);

        if (aTags.category !== bTags.category) {
            return aTags.category.localeCompare(bTags.category, 'en');
        }
        return aTags.order - bTags.order;
    });
docs.children[0].flags.isFirst = true;

const source = fs.readFileSync(path.resolve(__dirname, 'api.hbs'), 'utf8');

handlebars.registerHelper('category', function render(comment, options) {
    const tags = getTags(comment);
    if (tags.order === 1) {
        return options.fn({
            categoryName: tags.category
        });
    }
});

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
    path.resolve(__dirname, '..', 'docs', 'api.html'),
    template(docs)
);
