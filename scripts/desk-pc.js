let pc_is_on = true; // The state when the page loads

const desk_image_divs = document.querySelectorAll(".div-site-backgrounds-parent > img");

function pcClearLayerStates() {
    desk_image_divs.forEach(element => {
        element.classList.remove('desk-is-running-off-animation', 'desk-is-running-on-animation', 'desk-init-off', 'desk-init-on');
        void element.offsetWidth;
    });
}

function pcOnButton() {
    pc_is_on = !pc_is_on;

    pcClearLayerStates();
    localStorage.setItem("pc_is_on", pc_is_on);

    console.log(localStorage.getItem("pc_is_on"));

    desk_image_divs.forEach(element => {
        element.classList.add(pc_is_on ? 'desk-is-running-on-animation' : 'desk-is-running-off-animation');
        console.log(0);

    });
}

function pcInitLayers(init_state) {
    pcClearLayerStates();
    desk_image_divs.forEach(element => {
        element.classList.add(init_state ? 'desk-init-on' : 'desk-init-off');
    });
}

function pcGetStoredState() {
    let stored_pc_is_on = localStorage.getItem("pc_is_on");
    if (stored_pc_is_on === null) {
        localStorage.setItem("pc_is_on", pc_is_on);
    } else {
        pc_is_on = (stored_pc_is_on === 'true');
    }
}

// -- Store if pc is on or not to local storage

pcGetStoredState();
pcInitLayers(pc_is_on);