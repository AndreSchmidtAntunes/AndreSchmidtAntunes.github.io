function initDesktopFeatures() {
    initDesktopClock();
}

const mql = window.matchMedia("(orientation: portrait)");

mql.addEventListener("change", (e) => {
    updateDesktopClock();
});

function initDesktopClock() {
    updateDesktopClock();
    const remaining = 1000 - new Date().getMilliseconds();

    // wait until the next exact second to start a 1-second update loop of the current time
    setTimeout(() => {
        setInterval(() => updateDesktopClock(), 1000);
    }, remaining);
}

function updateDesktopClock() {
    let date = new Date();

    function resolveTimeText(value) {
        return (value <= 9 ? "0" : "") + value.toString();
    }

    let h = resolveTimeText(date.getHours())
    let m = resolveTimeText(date.getMinutes())
    let s = resolveTimeText(date.getSeconds())

    let timeStr = h + ':' + m;

    if (!IsPortrait())
        timeStr += ':' + s;

    document.getElementById('taskbar-clock-p').innerHTML = timeStr;
}

