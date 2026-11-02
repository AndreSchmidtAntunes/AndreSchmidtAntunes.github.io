const desktopScreenE = document.getElementById('screen');
const windowsContainer = document.getElementById('windows-container');

let windowOrderList = [];

let desktopScreenRect = desktopScreenE.getBoundingClientRect();

const screenResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries)
        desktopScreenRect = desktopScreenE.getBoundingClientRect();
});
screenResizeObserver.observe(document.body); // TODO: set to viewport

function spawnWindow(strFileName) {
    var window = document.createElement('div');

    window.className = 'window';
    window.id = generateHash(strFileName).toString();

    windowsContainer.appendChild(window);

    const windowBasePath = "resources/html/core/window-base.html"
    const windowsDirectory = windowBasePath + "/../../windows/";

    // Load base window div
    $(window).load(windowBasePath, function () {
        var windowContent = window.querySelector(".window-content");

        // Load inner content into the base div
        $(windowContent).load(windowsDirectory + strFileName,
            function () { // On Content Finished Loading

                // Set window Title
                window.querySelector(".window-title").textContent =
                    windowContent.querySelector('meta[data-name="window-title"]')?.content;

                // Set content box style
                windowContent.style.cssText =
                    windowContent.querySelector('meta[data-name="window-content-style"]')?.content;

                // Set default position ([top left X] [top left Y] [bottom right X] [bottom right Y])
                let defaultStateStr =
                    windowContent.querySelector('meta[data-name="window-default-state"]')?.content;

                if (defaultStateStr) {
                    let defaultState = defaultStateStr.split(" ");

                    window.style.left = defaultState[0] + 'cqw';
                    window.style.top = defaultState[1] + 'cqh';
                    window.style.width = "" + (Number(defaultState[2]) - Number(defaultState[0])) + 'cqw';
                    window.style.height = "" + (Number(defaultState[3]) - Number(defaultState[1])) + 'cqh';
                }

                window.classList.add("draggable");

                if (window === windowsContainer.firstElementChild) {
                    putOnTop(window, 0);
                }

                initDragElement(window);
                initResizeElement(window);

                windowsContainer.dispatchEvent(
                    new CustomEvent("window-spawned", {
                        detail: window
                    })
                );
                
                setActiveWindow(window);
            }
        );
    });
}

function closeWindow(closeBtn) {
    let window = closeBtn.closest('.window');
    windowOrderList.splice(windowOrderList.indexOf(window.id.toString()), 1);
    window.remove(); //TODO: Create window close animation
}

let storedScrollTop = 0;
function toggleMaximized(btn) {
    const win = btn.closest('.window');
    
    const isMaximized = win.classList.toggle('window-maximized');
    btn.textContent = isMaximized ? '󰖲' : '󰖯';

    if (IsPortrait()) {
        if (isMaximized) // store the scroll state before maximizing.
            storedScrollTop = windowsContainer.scrollTop;
        
        windowsContainer.classList.toggle('scroll', !isMaximized);
        windowsContainer.scrollTop = 0;
        putOnTop(isMaximized ? win : windowsContainer.firstElementChild, 200,
        ()=> {
            // set the scroll state every frame of un-maximizing.
            if (!isMaximized)
                windowsContainer.scrollTop = storedScrollTop;
        });
    }
    else {
        win.classList.add('animating');
        win.addEventListener('transitionend', () => {
            win.classList.remove('animating');
        }, {once: true});
    }
}

// Source - https://stackoverflow.com/a/77288314
// Posted by CodeNStuff
// Retrieved 2026-10-12, License - CC BY-SA 4.0
function putOnTop(win, animTime, onTick) {
    const items = [...windowsContainer.children];
    const topIdx = items.indexOf(win);
    if (topIdx < 0) return;

    const oldState = items.map(elem => elem.getBoundingClientRect());
    items.forEach((elem, idx) => elem.classList.toggle('top-window', idx === topIdx));
    const newState = items.map(elem => elem.getBoundingClientRect());

    items.map((elem, idx) => {
        const deltaX = oldState[idx].left - newState[idx].left;
        const deltaY = oldState[idx].top - newState[idx].top;

        let anim =  elem.animate(
            [{ transformOrigin: 'top left', transform: `translate(${deltaX}px, ${deltaY}px)` },
                { transformOrigin: 'top left', transform: 'none' }],
            { duration: animTime, easing: 'ease', fill: 'both' }
        );
        
        // Run the given onTick() function every frame of the put-on-top animation
        function update() {
                onTick?.();

            if (anim.playState === "running") {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    });
}

function setActiveWindow(window) {

    let windowIndex = windowOrderList.indexOf(window.id.toString());

    if (window.classList.contains('active-window'))
        return;

    document.getElementById(windowOrderList.at(-1))
        ?.classList.remove("active-window");

    if (windowIndex > -1) {
        windowOrderList.splice(windowIndex, 1);
    }

    windowOrderList.push(window.id.toString());

    for (let i = 0; i < windowOrderList.length; i++) {
        document.getElementById(windowOrderList.at(i)).style.zIndex = "" + i;
    }

    document.getElementById(windowOrderList.at(-1))
        .classList.add("active-window");
}

// TODO: Desktop icons
// TODO: Implement taskbar icons
// TODO: Minimise button

function initDragElement(window) {

    let windowToMouseOffsetX = 0, windowToMouseOffsetY = 0;
    var element = null;

    var titlebar = getTitlebarTitle(window);

    window.onpointerdown = function () {
        setActiveWindow(window);
    };

    if (titlebar) {
        titlebar.parentWindow = window;
        titlebar.onpointerdown = dragMouseDown;
    }

    function dragMouseDown(e) {
        if (IsPortrait())
            return;

        element = this.parentWindow;
        setActiveWindow(element);

        e = e || window.event;

        windowToMouseOffsetX = e.clientX - element.getBoundingClientRect().left;
        windowToMouseOffsetY = e.clientY - element.getBoundingClientRect().top;

        document.ontouchend = closeDragElement;
        document.onpointerup = closeDragElement;

        // call a function whenever the cursor moves:
        document.ontouchmove = elementDrag;
        document.onpointermove = elementDrag;
    }

    function elementDrag(e) {
        if (!element) {
            return;
        }

        e = e || window.event;

        // calculate new window position in px:

        let pxTop = e.clientY - windowToMouseOffsetY - desktopScreenRect.top;
        let pxLeft = e.clientX - windowToMouseOffsetX - desktopScreenRect.left;

        // convert px to cqh and cqw:

        let cqhTop = (pxTop / desktopScreenRect.height) * 100;
        let cqwLeft = (pxLeft / desktopScreenRect.width) * 100;

        // restricts the window to only be within the desktop:

        // gets element height and width style values in px
        let elementHeight = parseFloat(getComputedStyle(element).height);
        let elementWidth = parseFloat(getComputedStyle(element).width);

        // converts px to cqh and cqw
        let cqhElementHeight = (elementHeight / desktopScreenRect.height) * 100;
        let cqwElementWidth = (elementWidth / desktopScreenRect.width) * 100;

        // clamps the resizing to be within the desktop screen
        cqhTop = cqhTop.clamp(0, 100 - cqhElementHeight);
        cqwLeft = cqwLeft.clamp(0, 100 - cqwElementWidth);

        element.style.top = cqhTop + "cqh";
        element.style.left = cqwLeft + "cqw";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onpointerup = null;
        document.ontouchend = null;

        document.onpointermove = null;
        document.ontouchmove = null;
    }
}

function getTitlebarTitle(element) {
    var headerItems = element.getElementsByClassName("window-title");

    if (headerItems.length === 1) {
        return headerItems[0];
    }
    return null;
}

function initResizeElement(windowR) {

    var element = null;
    var startX, startY, startWidth, startHeight;

    var right = document.createElement("div");
    right.className = "resizer-right";
    right.classList.add("draggable");

    windowR.appendChild(right);
    right.addEventListener("pointerdown", initDrag, false);
    right.parentWindow = windowR;

    var bottom = document.createElement("div");
    bottom.className = "resizer-bottom";
    bottom.classList.add("draggable");


    windowR.appendChild(bottom);
    bottom.addEventListener("pointerdown", initDrag, false);
    bottom.parentWindow = windowR;

    var both = document.createElement("div");
    both.className = "resizer-both";
    windowR.appendChild(both);
    both.classList.add("draggable");

    both.addEventListener("pointerdown", initDrag, false);
    both.parentWindow = windowR;

    function initDrag(e) {
        element = this.parentWindow;

        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(
            document.defaultView.getComputedStyle(element).width,
            10
        );
        startHeight = parseInt(
            document.defaultView.getComputedStyle(element).height,
            10
        );
        document.documentElement.addEventListener("pointermove", doDrag, false);
        document.documentElement.addEventListener("pointerup", stopDrag, false);
    }

    function doDrag(e) {
        if (IsPortrait()) {
            let pxHeight = startHeight + e.clientY - startY;
            let cqhHeight = (pxHeight / desktopScreenRect.height) * 100;
            element.style.height = cqhHeight + "%";
            return;
        }

        let pxWidth = startWidth + e.clientX - startX;
        let pxHeight = startHeight + e.clientY - startY;

        let cqwWidth = (pxWidth / desktopScreenRect.width) * 100;
        let cqhHeight = (pxHeight / desktopScreenRect.height) * 100;

        // restricts the window to only be within the desktop:

        // gets element top and left style values in px
        let elementTop = parseFloat(getComputedStyle(element).top);
        let elementLeft = parseFloat(getComputedStyle(element).left)

        // converts px to cqh and cqw
        let cqhElementTop = (elementTop / desktopScreenRect.height) * 100;
        let cqwElementLeft = (elementLeft / desktopScreenRect.width) * 100;

        // clamps the resizing to be within the desktop screen
        cqhHeight = cqhHeight.clamp(0, 100 - cqhElementTop);
        cqwWidth = cqwWidth.clamp(0, 100 - cqwElementLeft);

        element.style.width = cqwWidth + "cqw";
        element.style.height = cqhHeight + "cqh";
    }

    function stopDrag() {
        document.documentElement.removeEventListener("pointermove", doDrag, false);
        document.documentElement.removeEventListener("pointerup", stopDrag, false);
    }
}

// Helper

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

const desktopQuery = window.matchMedia('(min-width: 640px)');

function updateDesktopClass(e) {
    const classList = document.body.classList;
    classList.toggle('desktop', e.matches);
    classList.toggle('mobile', !e.matches);
}

updateDesktopClass(desktopQuery); // set it on load
desktopQuery.addEventListener('change', updateDesktopClass); // update on resize/rotate

function IsPortrait() {
    return document.body.classList.contains('mobile');
}

const generateHash = (string) => {
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Constrain to 32bit integer
    }
    return hash;
};