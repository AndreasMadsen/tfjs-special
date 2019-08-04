(function () {
    document.querySelectorAll('pre code').forEach((codeElement) => {
        const preElement = codeElement.parentNode;

        hljs.highlightBlock(codeElement);

        const code = codeElement.innerText;

        const output = document.createElement('pre');
        output.classList.add('api-code-output');

        const content = document.createElement('span');
        output.appendChild(content);

        const run = document.createElement('button');
        run.addEventListener('click', function () {
            runCode(code, content);
        });
        run.appendChild(document.createTextNode('run'));

        output.appendChild(run);
        preElement.insertAdjacentElement('afterend', output);
    });

    function runCode(sourceCode, contentElement) {
        const evalCode = 'tf.tidy(function () {' + sourceCode + '});';
        const log = console.log;
        try {
            console.log = function (tfPrintString) {
                contentElement.innerText = tfPrintString;
            };
            eval(evalCode);
        } finally {
            console.log = log;
        }
    }
})();

