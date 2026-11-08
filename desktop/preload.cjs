const { contextBridge } = require("electron");

// Lets the game know it is the standalone app: no service worker is needed,
// and the offline indicator verifies the bundled files instead.
contextBridge.exposeInMainWorld("napeDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
