import { initDesktopFeatures } from './desktop.js'
import { initDeskLayers } from './desk.js'

import { windowsContainer, spawnWindow } from './window/window.js'
import { initContent } from './window/content/content.js'

initDeskLayers();
initDesktopFeatures();
initContent(windowsContainer);

spawnWindow('spout.html');
spawnWindow('welcome.html');
spawnWindow('projects.html');