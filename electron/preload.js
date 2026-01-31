const { contextBridge } = require('electron');

// Expor APIs seguras para o renderer process se necessário
contextBridge.exposeInMainWorld('electron', {
  version: process.versions.electron
});
