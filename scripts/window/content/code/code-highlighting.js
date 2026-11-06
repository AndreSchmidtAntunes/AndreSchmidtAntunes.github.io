import hljs from '/public/scripts/highlight/es/highlight.min.js';

import csharp from '/public/scripts/highlight/es/languages/csharp.min.js';
import cpp from '/public/scripts/highlight/es/languages/cpp.min.js';
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);

import { CopyButtonPlugin } from '/public/scripts/highlight/plugins/highlightjs-copy/highlightjs-copy.esm.js';
hljs.addPlugin(
    new CopyButtonPlugin({ 
        autohide: true 
    })
);

import { loadTypes, highlightCustomTypes } from './highlight-custom-types.js';
import customTypes from './custom-types.json' with { type: 'json' };
if (customTypes) {
    hljs.addPlugin({
        'after:highlightElement': ({ el, result }) => {
            if (result.language) highlightCustomTypes(el, result.language);
        }
    });
    await loadTypes(new URL('./custom-types.json', import.meta.url));
}

export function initCodeHighlighting(windowsContainer) {
    windowsContainer.addEventListener("window-spawned", (event) => highlightAllCodeInWindow(event.detail));
}

function highlightAllCodeInWindow(windowElement) {
    const codes = windowElement.querySelectorAll('pre > code');
    
    codes.forEach(element => {
        hljs.highlightElement(element);
        addLineNumbers(element);
    });
}

function addLineNumbers(codeEl) {
    // Split the highlighted HTML on newlines
    // (spans that cross lines are rare in C#/C++, but see the note below)
    const lines = codeEl.innerHTML.replace(/\n$/, '').split('\n');
    codeEl.innerHTML = lines
        .map(line => `<span class="line">${line || ' '}</span>`)
        .join('');
    codeEl.classList.add('numbered');
}
