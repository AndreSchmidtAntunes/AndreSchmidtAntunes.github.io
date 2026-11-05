import { hljs } from '../../highlight/highlight.js';
import csharp from '../../highlight/es/languages/csharp.min.js';
import cpp from '../../highlight/es/languages/cpp.min.js';

import { CopyButtonPlugin } from '../../highlightjs-copy/highlightjs-copy.js';

hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('cpp', cpp);

hljs.addPlugin(new CopyButtonPlugin({
    autohide: true,
}));

export function initCodeHighlighting(windowsContainer) {
    windowsContainer.addEventListener("window-spawned", (event) => highlightAllCodeInWindow(event.detail));
}

function highlightAllCodeInWindow(windowElement) {
    const codes = windowElement.querySelectorAll('pre > code');
    
    codes.forEach(element => {
        hljs.highlightElement(element);
    });
}