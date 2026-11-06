import { collectConstsAndLocals } from './collect-local-variables.js'

const typeSets = new Map();   // language -> Set of type names

export async function loadTypes(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const data = await res.json();
    for (const [lang, names] of Object.entries(data)) {
        typeSets.set(lang, new Set(names));
    }
}

const hueCache = new Map();
const IDENT = /(?<!\w)(\.)?([A-Za-z_]\w*)(\s*\()?/g;

function hue(name) {
    let h = hueCache.get(name);
    if (h === undefined) {
        h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
        hueCache.set(name, h);
    }
    return h;
}

export function highlightCustomTypes(root, language) {
    const langTypes = typeSets.get(language);
    const globalTypes = typeSets.get('*');
    
    const constsAndLocals = collectConstsAndLocals(root);
    const constVars= constsAndLocals.constants;
    const localVars = constsAndLocals.locals;
    
    for (const variableName of predefinedConstants(root)) constVars.add(variableName);
    
    for (const node of Array.from(root.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE) continue;

        const text = node.nodeValue;
        let frag = null, last = 0, m;
        IDENT.lastIndex = 0;

        while ((m = IDENT.exec(text)) !== null) {
            const dot = m[1], name = m[2], isCall = !!m[3];
            const start = m.index + (dot ? 1 : 0);
            const span = document.createElement('span');

            if (!dot && (langTypes?.has(name) || globalTypes?.has(name))) {
                span.className = 'hljs-type';          // checked first, so `new Player(` is a type
            } 
            else if (isCall) {
                span.className = 'hljs-title function_';   // Foo(  or  obj.Foo(
            } 
            else if (!dot) {
                span.className = 'hljs-variable';
                if (constVars.has(name)) span.classList.add('constant_');
                else if (localVars.has(name)) span.classList.add('local_');
            } 
            else continue;                                // obj.field: leave alone
            
            span.textContent = name;
            frag ??= document.createDocumentFragment();
            frag.append(text.slice(last, start), span);
            last = start + name.length;
        }

        if (frag) {
            frag.append(text.slice(last));
            node.replaceWith(frag);
        }
    }
}

function predefinedConstants(root) {
    const list = root.constants                       // JS property: codeEl.constants = ['MaxHealth']
        ?? root.dataset.constants?.split(/[\s,]+/);   // attribute: data-constants="MaxHealth, Speed"
    return new Set((list ?? []).filter(Boolean));
}