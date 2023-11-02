const { contextBridge, ipcRenderer, remote, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    remote: remote,
    shell: shell,
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getFilesInDirectory: (dir) => ipcRenderer.invoke('get-files-in-directory', dir),
    openDirectory: (dir) => ipcRenderer.invoke('open-directory', dir),
    path: {
        extname: (filePath) => {
            const path = require('path');
            return path.extname(filePath);
        }
    },
    invoke: (channel, ...args) => {
        return ipcRenderer.invoke(channel, ...args);
    },
    shell: shell
});
