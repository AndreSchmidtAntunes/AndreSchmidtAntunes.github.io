const NAME = String.raw`([A-Za-z_]\w*)`;
const SUFFIX = String.raw`(?:\[\s*,*\s*\])*(?:[*&?]+\s*|\s+)`;   // [] * & ? or just whitespace

// After an hljs type/built-in span (int, string...): name then ; , ) = : [ or `in`
const AFTER_TYPE = new RegExp(`^${SUFFIX}${NAME}(?=\\s*[=;,)[:]|\\s+in\\b)`);

// After an hljs keyword span (var, auto...): stricter, so `return x;` doesn't count
const AFTER_KEYWORD = new RegExp(`^\\s+${NAME}(?=\\s*=(?!=)|\\s+in\\b)`);

// Two plain identifiers in a row: `Player p;`  `Ns.Vec3* v,`  `List<Foo> items =`
const PLAIN_DECL = new RegExp(
    String.raw`(?<![\w.])[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?:<[^<>;()]*>)?` +
    `${SUFFIX}${NAME}(?=\\s*[=;,)[:]|\\s+in\\b)`, 'g');

const CONST_KW = new Set(['const', 'readonly', 'constexpr', 'constinit', 'enum', 'final']);

// Walk back through siblings until the previous statement ends
function isConstDecl(node) {
    for (let n = node.previousSibling; n; n = n.previousSibling) {
        if (n.nodeType === Node.TEXT_NODE) {
            if (/[;{}]/.test(n.nodeValue)) return false;
            continue;
        }
        if (CONST_KW.has(n.textContent)) return true;   // keyword span
    }
    return false;
}


export function collectConstsAndLocals(root) {
    const constants = new Set();
    const locals = new Set();
    const add = (name, node) => (isConstDecl(node) ? constants : locals).add(name);

    for (const node of root.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const text = node.nodeValue;
        const prev = node.previousSibling;

        if (prev?.nodeType === Node.ELEMENT_NODE) {
            const c = prev.classList;
            const m = (c.contains('hljs-type') || c.contains('hljs-built_in'))
                ? AFTER_TYPE.exec(text)
                : c.contains('hljs-keyword') ? AFTER_KEYWORD.exec(text) : null;
            if (m) add(m[1], node);
        }

        for (const m of text.matchAll(PLAIN_DECL)) add(m[1], node);
    }
    return { constants: constants, locals: locals };
}