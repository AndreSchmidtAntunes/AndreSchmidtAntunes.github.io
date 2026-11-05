import { initCodeHighlighting } from "./code-highlighting.js";

export function initContent(windowsContainer) {
    initCodeHighlighting(windowsContainer);
    
    windowsContainer.addEventListener("window-spawned",
        (event) => initScrollUpdater(event.detail));
}

function updateScrollState(windowContent) {
    windowContent.classList.toggle("at-top", windowContent.scrollTop === 0);
}

function initScrollUpdater(windowElement) {
    const windowContent = windowElement.querySelector(".window-content");
    if (!windowContent) return;

    let togglePreviewVideoButton = windowElement.querySelector('.toggle-video-button');
    if (togglePreviewVideoButton)
        togglePreviewVideoButton.onpointerdown = () => ToggleVideo(togglePreviewVideoButton);
    
    windowContent.addEventListener(
        "scroll",
        () => updateScrollState(windowContent),
        {passive: true}
    );

    updateScrollState(windowContent);
}

// Video preview controls


const controllers = new WeakMap();   // page -> AbortController for its open-state listeners
function setVideoState(page, maximize) {
    if (page.classList.contains('preview-maximized') === maximize) return;

    page.classList.add('anim');
    clearTimeout(page.animTimer);      // timer lives on the page, not a shared global
    page.animTimer = setTimeout(() => page.classList.remove('anim'), 700);
    page.classList.toggle('preview-maximized', maximize);

    if (!maximize) {
        controllers.get(page)?.abort();  // removes every listener added below
        controllers.delete(page);
        return;
    } else page.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
    });

    const ac = new AbortController();
    controllers.set(page, ac);
    const close = () => setVideoState(page, false);
    const opts = {signal: ac.signal, passive: true};
    let startY = 0;

    document.addEventListener('keydown', e => (e.key === 'Escape' || e.key === 'ArrowDown') && close(), {signal: ac.signal});
    page.addEventListener('wheel', e => e.deltaY > 0 && close(), opts);
    page.addEventListener('touchstart', e => startY = e.touches[0].clientY, opts);
    page.addEventListener('touchmove', e => e.touches[0].clientY < startY - 10 && close(), opts);
}

function ToggleVideo(btn) {
    const page = btn.closest('.window-content');
    setVideoState(page, !page.classList.contains('preview-maximized'));
}